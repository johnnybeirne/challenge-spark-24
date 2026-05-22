
-- 1) Columns
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS signup_ip text,
  ADD COLUMN IF NOT EXISTS suspected_self_referral boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_referral_reasons text[] NOT NULL DEFAULT '{}'::text[];

-- 2) Backfill first_name / surname from existing name where missing
UPDATE public.waitlist_signups
SET first_name = COALESCE(NULLIF(first_name,''), split_part(trim(name), ' ', 1)),
    surname    = COALESCE(NULLIF(surname,''),
                          NULLIF(trim(substring(trim(name) from position(' ' in trim(name)) + 1)), ''))
WHERE name IS NOT NULL
  AND trim(name) <> ''
  AND (first_name IS NULL OR surname IS NULL);

-- 3) Self-referral detection trigger
CREATE OR REPLACE FUNCTION public.flag_self_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter RECORD;
  reasons text[] := '{}';
  new_local text;
  inv_local text;
  new_first text;
  new_last  text;
  inv_first text;
  inv_last  text;
  email_lc  text;
BEGIN
  IF NEW.referred_by_code IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email, first_name, surname, name, signup_ip
    INTO inviter
    FROM public.waitlist_signups
   WHERE referral_code = NEW.referred_by_code;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  email_lc  := lower(coalesce(NEW.email, ''));
  new_local := lower(split_part(email_lc, '@', 1));
  inv_local := lower(split_part(coalesce(inviter.email,''), '@', 1));

  new_first := lower(coalesce(NULLIF(NEW.first_name,''), split_part(coalesce(NEW.name,''),' ',1)));
  new_last  := lower(coalesce(NULLIF(NEW.surname,''),
                              NULLIF(trim(substring(trim(coalesce(NEW.name,'')) from position(' ' in trim(coalesce(NEW.name,''))) + 1)), '')));
  inv_first := lower(coalesce(NULLIF(inviter.first_name,''), split_part(coalesce(inviter.name,''),' ',1)));
  inv_last  := lower(coalesce(NULLIF(inviter.surname,''),
                              NULLIF(trim(substring(trim(coalesce(inviter.name,'')) from position(' ' in trim(coalesce(inviter.name,''))) + 1)), '')));

  -- 1) same local-part
  IF new_local <> '' AND inv_local <> '' AND new_local = inv_local THEN
    reasons := array_append(reasons, 'same_local_part');
  END IF;

  -- 2) email contains inviter first or last name (length >= 3 to avoid false positives)
  IF inv_first <> '' AND length(inv_first) >= 3 AND position(inv_first in new_local) > 0 THEN
    reasons := array_append(reasons, 'email_contains_referrer_first_name');
  END IF;
  IF inv_last <> '' AND length(inv_last) >= 3 AND position(inv_last in new_local) > 0 THEN
    reasons := array_append(reasons, 'email_contains_referrer_surname');
  END IF;

  -- 3) same surname
  IF new_last <> '' AND inv_last <> '' AND new_last = inv_last THEN
    reasons := array_append(reasons, 'same_surname');
  END IF;

  -- 4) same IP
  IF NEW.signup_ip IS NOT NULL AND inviter.signup_ip IS NOT NULL
     AND NEW.signup_ip <> '' AND NEW.signup_ip = inviter.signup_ip THEN
    reasons := array_append(reasons, 'same_ip');
  END IF;

  IF array_length(reasons, 1) > 0 THEN
    NEW.suspected_self_referral := true;
    NEW.self_referral_reasons := reasons;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waitlist_flag_self_referral ON public.waitlist_signups;
CREATE TRIGGER waitlist_flag_self_referral
BEFORE INSERT ON public.waitlist_signups
FOR EACH ROW EXECUTE FUNCTION public.flag_self_referral();

-- 4) Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_clear_self_referral_flag(p_signup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.waitlist_signups
     SET suspected_self_referral = false,
         self_referral_reasons = '{}'::text[],
         updated_at = now()
   WHERE id = p_signup_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_void_waitlist_referral(p_signup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT referred_by_code INTO v_ref
    FROM public.waitlist_signups WHERE id = p_signup_id;

  IF v_ref IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.waitlist_signups
     SET referred_by_code = NULL,
         suspected_self_referral = false,
         self_referral_reasons = '{}'::text[],
         updated_at = now()
   WHERE id = p_signup_id;

  UPDATE public.waitlist_signups
     SET confirmed_invites = GREATEST(confirmed_invites - 1, 0),
         current_tier = public.calculate_waitlist_tier(GREATEST(confirmed_invites - 1, 0)),
         updated_at = now()
   WHERE referral_code = v_ref;
END;
$$;
