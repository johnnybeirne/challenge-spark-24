ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_flagged boolean NOT NULL DEFAULT false;

CREATE TABLE public.flagged_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid NOT NULL UNIQUE,
  referrer_user_id uuid,
  referred_email text,
  referrer_email text,
  invite_code text,
  reason text NOT NULL DEFAULT 'Same network as referrer',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT ON public.flagged_referrals TO authenticated;
GRANT ALL ON public.flagged_referrals TO service_role;
ALTER TABLE public.flagged_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read flagged referrals" ON public.flagged_referrals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Called by the signup-fingerprint function (service role). Withholds the referral credit this signup just triggered.
CREATE OR REPLACE FUNCTION public.flag_same_network_referral(p_user uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me record; inv record;
BEGIN
  SELECT user_id, email, referred_by, referred_by_parent, referral_flagged INTO me FROM public.profiles WHERE user_id = p_user;
  IF NOT FOUND OR me.referred_by IS NULL OR me.referral_flagged THEN RETURN false; END IF;
  SELECT user_id, email, created_at INTO inv FROM public.profiles WHERE invite_code = me.referred_by;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO public.flagged_referrals (referred_user_id, referrer_user_id, referred_email, referrer_email, invite_code)
  VALUES (p_user, inv.user_id, me.email, inv.email, me.referred_by)
  ON CONFLICT (referred_user_id) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.profiles SET referral_flagged = true WHERE user_id = p_user;
  UPDATE public.profiles SET direct_referral_count = GREATEST(direct_referral_count - 1, 0) WHERE user_id = inv.user_id;
  IF me.referred_by_parent IS NOT NULL THEN
    UPDATE public.profiles SET indirect_referral_count = GREATEST(indirect_referral_count - 1, 0) WHERE invite_code = me.referred_by_parent;
  END IF;
  UPDATE public.monthly_invite_tracking SET invite_count = GREATEST(invite_count - 1, 0), updated_at = now()
   WHERE user_id = inv.user_id AND month = public.access_cycle_key(inv.created_at, now());
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.flag_same_network_referral(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.flag_same_network_referral(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_resolve_flagged_referral(p_id uuid, p_approve boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  f record; me record; inv record; d smallint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO f FROM public.flagged_referrals WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF f.status <> 'pending' THEN RETURN f.status; END IF;

  IF NOT p_approve THEN
    UPDATE public.flagged_referrals SET status = 'dismissed', resolved_at = now() WHERE id = p_id;
    RETURN 'dismissed';
  END IF;

  UPDATE public.flagged_referrals SET status = 'approved', resolved_at = now() WHERE id = p_id;
  SELECT user_id, referred_by, referred_by_parent INTO me FROM public.profiles WHERE user_id = f.referred_user_id;
  SELECT user_id, created_at INTO inv FROM public.profiles WHERE user_id = f.referrer_user_id;
  IF me.user_id IS NULL OR inv.user_id IS NULL THEN RETURN 'approved'; END IF;

  UPDATE public.profiles SET referral_flagged = false WHERE user_id = me.user_id;
  UPDATE public.profiles SET direct_referral_count = direct_referral_count + 1 WHERE user_id = inv.user_id;
  IF me.referred_by_parent IS NOT NULL THEN
    UPDATE public.profiles SET indirect_referral_count = indirect_referral_count + 1 WHERE invite_code = me.referred_by_parent;
  END IF;
  INSERT INTO public.monthly_invite_tracking (user_id, month, invite_count)
  VALUES (inv.user_id, public.access_cycle_key(inv.created_at, now()), 1)
  ON CONFLICT (user_id, month) DO UPDATE SET invite_count = public.monthly_invite_tracking.invite_count + 1, updated_at = now();

  -- Credit any challenge days the participant already finished while flagged
  FOR d IN SELECT x::smallint FROM unnest(ARRAY[1,2,3]) x
           WHERE EXISTS (SELECT 1 FROM public.challenge_progress cp
                         WHERE cp.user_id = me.user_id AND cp.day_completed_at ? ('day' || x)) LOOP
    INSERT INTO public.referral_day_credits (referred_user_id, inviter_user_id, inviter_invite_code, day)
    VALUES (me.user_id, inv.user_id, me.referred_by, d) ON CONFLICT (referred_user_id, day) DO NOTHING;
    IF FOUND THEN
      IF d = 1 THEN UPDATE public.profiles SET referral_day1_complete_count = referral_day1_complete_count + 1 WHERE user_id = inv.user_id;
      ELSIF d = 2 THEN UPDATE public.profiles SET referral_day2_complete_count = referral_day2_complete_count + 1 WHERE user_id = inv.user_id;
      ELSE UPDATE public.profiles SET referral_day3_complete_count = referral_day3_complete_count + 1 WHERE user_id = inv.user_id;
      END IF;
    END IF;
  END LOOP;
  RETURN 'approved';
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_resolve_flagged_referral(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_flagged_referral(uuid, boolean) TO authenticated;

-- Flagged referrals earn no day credit until approved
CREATE OR REPLACE FUNCTION public.award_referral_day_credit(p_day smallint)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_ref_code text;
  v_flagged boolean;
  v_inviter_user_id uuid;
  v_inserted_rows integer := 0;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated'); END IF;
  IF p_day IS NULL OR p_day NOT IN (1,2,3) THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_day'); END IF;
  SELECT referred_by, referral_flagged INTO v_ref_code, v_flagged FROM public.profiles WHERE user_id = v_user;
  IF v_ref_code IS NULL THEN RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'no_referrer', 'day', p_day); END IF;
  IF COALESCE(v_flagged, false) THEN RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'flagged', 'day', p_day); END IF;
  SELECT user_id INTO v_inviter_user_id FROM public.profiles WHERE invite_code = v_ref_code;
  IF v_inviter_user_id IS NULL OR v_inviter_user_id = v_user THEN
    RETURN jsonb_build_object('ok', true, 'credited', false, 'reason', 'inviter_not_found_or_self', 'day', p_day);
  END IF;
  INSERT INTO public.referral_day_credits (referred_user_id, inviter_user_id, inviter_invite_code, day)
  VALUES (v_user, v_inviter_user_id, v_ref_code, p_day) ON CONFLICT (referred_user_id, day) DO NOTHING;
  GET DIAGNOSTICS v_inserted_rows = ROW_COUNT;
  IF v_inserted_rows > 0 THEN
    IF p_day = 1 THEN UPDATE public.profiles SET referral_day1_complete_count = referral_day1_complete_count + 1 WHERE user_id = v_inviter_user_id;
    ELSIF p_day = 2 THEN UPDATE public.profiles SET referral_day2_complete_count = referral_day2_complete_count + 1 WHERE user_id = v_inviter_user_id;
    ELSIF p_day = 3 THEN UPDATE public.profiles SET referral_day3_complete_count = referral_day3_complete_count + 1 WHERE user_id = v_inviter_user_id;
    END IF;
  END IF;
  RETURN jsonb_build_object('ok', true, 'credited', v_inserted_rows > 0, 'day', p_day);
END;
$function$;