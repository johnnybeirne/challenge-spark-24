-- Close privilege-escalation gaps on self-service INSERT for partners and promoters.
-- UPDATE was already protected by guard/validate triggers; INSERT was not, so a
-- user could set their own commission rates, status, approval, and founding flags.
-- These BEFORE INSERT triggers force safe values for any non-admin writer.

CREATE OR REPLACE FUNCTION public.guard_partner_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.status := 'pending'::partner_status;
    NEW.parent_partner_id := NULL;
    NEW.default_commission_type := 'percent'::commission_kind;
    NEW.default_commission_value := 30;
    NEW.default_l2_commission_type := 'percent'::commission_kind;
    NEW.default_l2_commission_value := 10;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_partner_insert
  BEFORE INSERT ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.guard_partner_insert();

CREATE OR REPLACE FUNCTION public.guard_promoter_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_approved := false;
    NEW.is_founding_partner := false;
    NEW.tier := 'bronze';
    NEW.quality_score := 0;
    NEW.founding_rank := NULL;
    NEW.founding_joined_at := NULL;
    NEW.approved_at := NULL;
    NEW.is_eligible_for_promotion := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_promoter_insert
  BEFORE INSERT ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.guard_promoter_insert();