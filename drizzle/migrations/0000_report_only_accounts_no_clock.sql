-- 1. Report-only signups must NOT create a challenge_progress row,
--    because that row is the signup anchor (started_at) for the day gate.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_invite_code text;
  ref_code text;
  parent_ref text;
  v_signup_product text;
  v_entry_intent text;
  v_is_report boolean;
BEGIN
  new_invite_code := substr(md5(random()::text), 1, 8);
  ref_code := NEW.raw_user_meta_data->>'referred_by';
  v_signup_product := NEW.raw_user_meta_data->>'signup_product';
  v_entry_intent := NEW.raw_user_meta_data->>'entry_intent';
  v_is_report := (v_signup_product = 'report' OR v_entry_intent = 'report');

  IF ref_code IS NOT NULL THEN
    SELECT referred_by INTO parent_ref FROM public.profiles WHERE invite_code = ref_code;
  END IF;

  INSERT INTO public.profiles (user_id, email, name, invite_code, referred_by, referred_by_parent, signup_product, entry_intent)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    new_invite_code,
    ref_code,
    parent_ref,
    v_signup_product,
    v_entry_intent
  );

  IF ref_code IS NOT NULL THEN
    UPDATE public.profiles SET direct_referral_count = direct_referral_count + 1 WHERE invite_code = ref_code;
  END IF;

  IF parent_ref IS NOT NULL THEN
    UPDATE public.profiles SET indirect_referral_count = indirect_referral_count + 1 WHERE invite_code = parent_ref;
  END IF;

  -- Report-only accounts stay pre-challenge: no progress row, no clock, no day open.
  IF NOT v_is_report THEN
    INSERT INTO public.challenge_progress (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. The single place the challenge clock is anchored for an existing account.
--    Idempotent: an existing progress row is never re-anchored.
CREATE OR REPLACE FUNCTION public.start_challenge_for_current_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.challenge_progress (user_id)
  VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
     SET signup_product = 'challenge',
         entry_intent = NULLIF(entry_intent, 'report')
   WHERE user_id = v_user
     AND (signup_product = 'report' OR entry_intent = 'report');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.start_challenge_for_current_user() TO authenticated;