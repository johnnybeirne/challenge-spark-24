-- Re-create owner UPDATE policy with WITH CHECK matching ownership
DROP POLICY IF EXISTS "Users can update own promoter record" ON public.promoters;
CREATE POLICY "Users can update own promoter record"
  ON public.promoters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin-only policy so admins can still manage promoter approval/tier/founding status
DROP POLICY IF EXISTS "Admins can update any promoter record" ON public.promoters;
CREATE POLICY "Admins can update any promoter record"
  ON public.promoters
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Validation trigger: fires before the auto tier trigger so it sees the user-proposed row.
-- Non-admin owners can only change conversions/assessment_starts; everything else is admin-only.
CREATE OR REPLACE FUNCTION public.promoters_validate_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.partner_code IS DISTINCT FROM OLD.partner_code THEN
    RAISE EXCEPTION 'Users cannot change their own partner code';
  END IF;
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Users cannot change their own tier';
  END IF;
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION 'Users cannot approve themselves';
  END IF;
  IF NEW.is_founding_partner IS DISTINCT FROM OLD.is_founding_partner THEN
    RAISE EXCEPTION 'Users cannot grant themselves founding partner status';
  END IF;
  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Users cannot change their own approval date';
  END IF;
  IF NEW.is_eligible_for_promotion IS DISTINCT FROM OLD.is_eligible_for_promotion THEN
    RAISE EXCEPTION 'Users cannot change their own promotion eligibility';
  END IF;
  IF NEW.quality_score IS DISTINCT FROM OLD.quality_score THEN
    RAISE EXCEPTION 'Users cannot change their own quality score';
  END IF;
  IF NEW.founding_rank IS DISTINCT FROM OLD.founding_rank THEN
    RAISE EXCEPTION 'Users cannot change their own founding rank';
  END IF;
  IF NEW.founding_joined_at IS DISTINCT FROM OLD.founding_joined_at THEN
    RAISE EXCEPTION 'Users cannot change their own founding join date';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aaa_validate_promoter_self_update ON public.promoters;
CREATE TRIGGER aaa_validate_promoter_self_update
  BEFORE UPDATE ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.promoters_validate_self_update();