-- Ledger: one row per referred sign-up, guarantees credit is decided exactly one time
CREATE TABLE public.referral_signup_credits (
  referred_user_id uuid PRIMARY KEY,
  status text NOT NULL,              -- 'awarded' | 'withheld' | 'legacy'
  source text NOT NULL DEFAULT 'fingerprint',
  decided_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.referral_signup_credits TO service_role;
GRANT SELECT ON public.referral_signup_credits TO authenticated;
ALTER TABLE public.referral_signup_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read referral signup credits" ON public.referral_signup_credits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Existing referred accounts were already credited under the old flow
INSERT INTO public.referral_signup_credits (referred_user_id, status, source)
SELECT user_id, 'legacy', 'backfill' FROM public.profiles WHERE referred_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- Validation only, no credit at account creation
CREATE OR REPLACE FUNCTION public.process_referral()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE inviter_record RECORD;
BEGIN
  IF NEW.referred_by IS NULL THEN RETURN NEW; END IF;
  IF NEW.referred_by = NEW.invite_code THEN NEW.referred_by := NULL; RETURN NEW; END IF;
  SELECT invite_code, referred_by INTO inviter_record FROM public.profiles WHERE invite_code = NEW.referred_by;
  IF NOT FOUND THEN NEW.referred_by := NULL; RETURN NEW; END IF;
  IF inviter_record.referred_by IS NOT NULL THEN NEW.referred_by_parent := inviter_record.referred_by; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  new_invite_code text; ref_code text; parent_ref text;
  v_signup_product text; v_entry_intent text; v_is_report boolean;
BEGIN
  new_invite_code := substr(md5(random()::text), 1, 8);
  ref_code := NEW.raw_user_meta_data->>'referred_by';
  v_signup_product := NEW.raw_user_meta_data->>'signup_product';
  v_entry_intent := NEW.raw_user_meta_data->>'entry_intent';
  v_is_report := (v_signup_product = 'report' OR v_entry_intent = 'report');
  IF ref_code IS NOT NULL THEN
    SELECT referred_by INTO parent_ref FROM public.profiles WHERE invite_code = ref_code;
  END IF;
  INSERT INTO public.profiles (user_id, email, name, invite_code, referred_by, referred_by_parent, signup_product, entry_intent, journey_tag)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), new_invite_code, ref_code, parent_ref,
          v_signup_product, v_entry_intent, NEW.raw_user_meta_data->>'journey_tag');
  -- Referral credit is awarded later by award_signup_referral (after the same-network check)
  IF NOT v_is_report THEN
    INSERT INTO public.challenge_progress (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Single place that decides referral credit. Idempotent via the ledger.
CREATE OR REPLACE FUNCTION public.award_signup_referral(p_user uuid, p_flagged boolean, p_source text DEFAULT 'fingerprint')
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE me record; inv record; v_rows integer;
BEGIN
  SELECT user_id, email, referred_by, referred_by_parent INTO me FROM public.profiles WHERE user_id = p_user;
  IF NOT FOUND OR me.referred_by IS NULL THEN RETURN 'no_referrer'; END IF;
  SELECT user_id, email, created_at INTO inv FROM public.profiles WHERE invite_code = me.referred_by;
  IF NOT FOUND OR inv.user_id = p_user THEN RETURN 'no_inviter'; END IF;

  INSERT INTO public.referral_signup_credits (referred_user_id, status, source)
  VALUES (p_user, CASE WHEN p_flagged THEN 'withheld' ELSE 'awarded' END, p_source)
  ON CONFLICT (referred_user_id) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RETURN 'already_decided'; END IF;

  IF p_flagged THEN
    INSERT INTO public.flagged_referrals (referred_user_id, referrer_user_id, referred_email, referrer_email, invite_code)
    VALUES (p_user, inv.user_id, me.email, inv.email, me.referred_by)
    ON CONFLICT (referred_user_id) DO NOTHING;
    UPDATE public.profiles SET referral_flagged = true WHERE user_id = p_user;
    RETURN 'withheld';
  END IF;

  UPDATE public.profiles SET direct_referral_count = direct_referral_count + 1 WHERE user_id = inv.user_id;
  IF me.referred_by_parent IS NOT NULL THEN
    UPDATE public.profiles SET indirect_referral_count = indirect_referral_count + 1 WHERE invite_code = me.referred_by_parent;
  END IF;
  INSERT INTO public.monthly_invite_tracking (user_id, month, invite_count)
  VALUES (inv.user_id, public.access_cycle_key(inv.created_at, now()), 1)
  ON CONFLICT (user_id, month) DO UPDATE
    SET invite_count = public.monthly_invite_tracking.invite_count + 1, updated_at = now();
  RETURN 'awarded';
END;
$function$;
REVOKE ALL ON FUNCTION public.award_signup_referral(uuid, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_signup_referral(uuid, boolean, text) TO service_role;

-- Old flag function no longer subtracts anything; it only withholds
CREATE OR REPLACE FUNCTION public.flag_same_network_referral(p_user uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.award_signup_referral(p_user, true) = 'withheld';
END $function$;

-- Fallback: credit referred sign-ups the network check never decided
CREATE OR REPLACE FUNCTION public.award_pending_signup_referrals()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN SELECT p.user_id FROM public.profiles p
           WHERE p.referred_by IS NOT NULL
             AND p.created_at < now() - interval '5 minutes'
             AND NOT EXISTS (SELECT 1 FROM public.referral_signup_credits c WHERE c.referred_user_id = p.user_id)
  LOOP
    IF public.award_signup_referral(r.user_id, false, 'fallback') = 'awarded' THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $function$;
REVOKE ALL ON FUNCTION public.award_pending_signup_referrals() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('award-pending-signup-referrals', '0 * * * *', $$SELECT public.award_pending_signup_referrals();$$);