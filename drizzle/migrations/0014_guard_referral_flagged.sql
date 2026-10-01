CREATE OR REPLACE FUNCTION public.guard_profile_columns()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.premium_since := OLD.premium_since;
    NEW.direct_referral_count := OLD.direct_referral_count;
    NEW.indirect_referral_count := OLD.indirect_referral_count;
    NEW.referral_day1_complete_count := OLD.referral_day1_complete_count;
    NEW.referral_day2_complete_count := OLD.referral_day2_complete_count;
    NEW.referral_day3_complete_count := OLD.referral_day3_complete_count;
    NEW.referral_quiz_complete_count := OLD.referral_quiz_complete_count;
    NEW.suspected_signup_dup_ip := OLD.suspected_signup_dup_ip;
    NEW.referral_flagged := OLD.referral_flagged;
  END IF;
  RETURN NEW;
END;
$function$;