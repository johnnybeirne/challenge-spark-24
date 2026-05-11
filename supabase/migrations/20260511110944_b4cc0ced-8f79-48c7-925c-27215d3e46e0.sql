ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_product text,
  ADD COLUMN IF NOT EXISTS entry_intent text;

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
BEGIN
  new_invite_code := substr(md5(random()::text), 1, 8);
  ref_code := NEW.raw_user_meta_data->>'referred_by';
  v_signup_product := NEW.raw_user_meta_data->>'signup_product';
  v_entry_intent := NEW.raw_user_meta_data->>'entry_intent';

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

  INSERT INTO public.challenge_progress (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$function$;