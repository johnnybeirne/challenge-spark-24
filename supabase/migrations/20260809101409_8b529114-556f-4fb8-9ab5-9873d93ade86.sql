CREATE OR REPLACE FUNCTION public.process_referral()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inviter_record RECORD;
  v_inviter_user_id uuid;
BEGIN
  -- Skip if no referral
  IF NEW.referred_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent self-referral
  IF NEW.referred_by = NEW.invite_code THEN
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  -- Look up the inviter
  SELECT invite_code, referred_by, user_id INTO inviter_record
  FROM public.profiles
  WHERE invite_code = NEW.referred_by;

  IF NOT FOUND THEN
    NEW.referred_by := NULL;
    RETURN NEW;
  END IF;

  -- Set parent (level 2) if inviter was also referred
  IF inviter_record.referred_by IS NOT NULL THEN
    NEW.referred_by_parent := inviter_record.referred_by;
  END IF;

  -- Increment direct count for inviter
  UPDATE public.profiles
  SET direct_referral_count = direct_referral_count + 1
  WHERE invite_code = NEW.referred_by;

  -- Increment indirect count for parent
  IF NEW.referred_by_parent IS NOT NULL THEN
    UPDATE public.profiles
    SET indirect_referral_count = indirect_referral_count + 1
    WHERE invite_code = NEW.referred_by_parent;
  END IF;

  -- Monthly invite tracking for the inviter (current month, YYYY-MM)
  v_inviter_user_id := inviter_record.user_id;
  IF v_inviter_user_id IS NOT NULL THEN
    INSERT INTO public.monthly_invite_tracking (user_id, month, invite_count)
    VALUES (v_inviter_user_id, to_char(now() AT TIME ZONE 'utc', 'YYYY-MM'), 1)
    ON CONFLICT (user_id, month) DO UPDATE
      SET invite_count = public.monthly_invite_tracking.invite_count + 1,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;