CREATE OR REPLACE FUNCTION public.access_cycle_key(p_signup_at timestamptz, p_now timestamptz DEFAULT now())
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT to_char(
    (p_signup_at + (floor(GREATEST(EXTRACT(EPOCH FROM (p_now - p_signup_at)), 0) / (28*24*60*60)) * interval '28 days'))::date,
    'YYYY-MM-DD'
  );
$$;

CREATE OR REPLACE FUNCTION public.process_referral()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inviter_record RECORD;
  v_inviter_user_id uuid;
  v_cycle_key text;
BEGIN
  IF NEW.referred_by IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.referred_by = NEW.invite_code THEN
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  SELECT invite_code, referred_by, user_id, created_at INTO inviter_record
  FROM public.profiles
  WHERE invite_code = NEW.referred_by;

  IF NOT FOUND THEN
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  IF inviter_record.referred_by IS NOT NULL THEN
    NEW.referred_by_parent := inviter_record.referred_by;
  END IF;

  UPDATE public.profiles
  SET direct_referral_count = direct_referral_count + 1
  WHERE invite_code = NEW.referred_by;

  IF NEW.referred_by_parent IS NOT NULL THEN
    UPDATE public.profiles
    SET indirect_referral_count = indirect_referral_count + 1
    WHERE invite_code = NEW.referred_by_parent;
  END IF;

  -- Invite tracking keyed to the inviter's rolling 28 day cycle
  v_inviter_user_id := inviter_record.user_id;
  IF v_inviter_user_id IS NOT NULL THEN
    v_cycle_key := public.access_cycle_key(inviter_record.created_at, now());
    INSERT INTO public.monthly_invite_tracking (user_id, month, invite_count)
    VALUES (v_inviter_user_id, v_cycle_key, 1)
    ON CONFLICT (user_id, month) DO UPDATE
      SET invite_count = public.monthly_invite_tracking.invite_count + 1,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;