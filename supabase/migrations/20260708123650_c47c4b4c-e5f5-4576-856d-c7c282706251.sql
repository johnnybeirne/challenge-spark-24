-- ai_user_context: add WITH CHECK to UPDATE policy, then enforce column restrictions via trigger
DROP POLICY IF EXISTS "Users update own ai context" ON public.ai_user_context;
CREATE POLICY "Users update own ai context"
  ON public.ai_user_context
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ai_user_context_validate_self_update()
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
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'Users cannot change their own premium status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_user_context_self_update ON public.ai_user_context;
CREATE TRIGGER trg_ai_user_context_self_update
  BEFORE UPDATE ON public.ai_user_context
  FOR EACH ROW EXECUTE FUNCTION public.ai_user_context_validate_self_update();

-- profiles: add WITH CHECK to UPDATE policy, then enforce column restrictions via trigger
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.profiles_validate_self_update()
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
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'Users cannot change their own premium status';
  END IF;
  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION 'Users cannot change their own Stripe customer ID';
  END IF;
  IF NEW.direct_referral_count IS DISTINCT FROM OLD.direct_referral_count THEN
    RAISE EXCEPTION 'Users cannot change their own referral counts';
  END IF;
  IF NEW.indirect_referral_count IS DISTINCT FROM OLD.indirect_referral_count THEN
    RAISE EXCEPTION 'Users cannot change their own referral counts';
  END IF;
  IF NEW.invite_code IS DISTINCT FROM OLD.invite_code THEN
    RAISE EXCEPTION 'Users cannot change their own invite code';
  END IF;
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'Users cannot change their own referrer';
  END IF;
  IF NEW.referred_by_parent IS DISTINCT FROM OLD.referred_by_parent THEN
    RAISE EXCEPTION 'Users cannot change their own parent referrer';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_self_update ON public.profiles;
CREATE TRIGGER trg_profiles_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_validate_self_update();

-- partners: add WITH CHECK to UPDATE policy, then enforce column restrictions via trigger
DROP POLICY IF EXISTS "Owner can update own partner" ON public.partners;
CREATE POLICY "Owner can update own partner"
  ON public.partners
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.partners_validate_self_update()
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
  IF NEW.default_commission_type IS DISTINCT FROM OLD.default_commission_type THEN
    RAISE EXCEPTION 'Partners cannot change their own commission type';
  END IF;
  IF NEW.default_commission_value IS DISTINCT FROM OLD.default_commission_value THEN
    RAISE EXCEPTION 'Partners cannot change their own commission value';
  END IF;
  IF NEW.default_l2_commission_type IS DISTINCT FROM OLD.default_l2_commission_type THEN
    RAISE EXCEPTION 'Partners cannot change their own L2 commission type';
  END IF;
  IF NEW.default_l2_commission_value IS DISTINCT FROM OLD.default_l2_commission_value THEN
    RAISE EXCEPTION 'Partners cannot change their own L2 commission value';
  END IF;
  IF NEW.parent_partner_id IS DISTINCT FROM OLD.parent_partner_id THEN
    RAISE EXCEPTION 'Partners cannot change their own parent partner';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partners_self_update ON public.partners;
CREATE TRIGGER trg_partners_self_update
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.partners_validate_self_update();