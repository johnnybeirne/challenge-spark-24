-- ==========================================================
-- Protect privileged columns on partners, profiles, promoters
-- from self-modification by non-admin authenticated users.
-- Service role (auth.uid() IS NULL) and admins are exempt.
-- ==========================================================

-- ---------- partners ----------
CREATE OR REPLACE FUNCTION public.guard_partner_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.default_commission_value := OLD.default_commission_value;
    NEW.default_l2_commission_value := OLD.default_l2_commission_value;
    NEW.status := OLD.status;
    NEW.parent_partner_id := OLD.parent_partner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_partner_columns ON public.partners;
CREATE TRIGGER guard_partner_columns
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.guard_partner_columns();

-- ---------- profiles ----------
CREATE OR REPLACE FUNCTION public.guard_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_columns ON public.profiles;
CREATE TRIGGER guard_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_columns();

-- ---------- promoters ----------
CREATE OR REPLACE FUNCTION public.guard_promoter_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_approved := OLD.is_approved;
    NEW.is_founding_partner := OLD.is_founding_partner;
    NEW.tier := OLD.tier;
    NEW.quality_score := OLD.quality_score;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_promoter_columns ON public.promoters;
CREATE TRIGGER guard_promoter_columns
  BEFORE UPDATE ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.guard_promoter_columns();