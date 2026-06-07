
-- 1) COUPONS: drop public read, add validate helper
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Enter a coupon code');
  END IF;

  SELECT code, label, final_price, original_price, is_active, expires_at, max_redemptions, redemption_count
    INTO c
    FROM public.coupons
   WHERE upper(code) = upper(trim(p_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Coupon not recognised');
  END IF;
  IF NOT c.is_active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Coupon is inactive');
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Coupon has expired');
  END IF;
  IF c.max_redemptions IS NOT NULL AND c.redemption_count >= c.max_redemptions THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Coupon fully redeemed');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'code', c.code,
    'label', COALESCE(c.label, ''),
    'final_price', c.final_price,
    'original_price', c.original_price
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

-- 2) EMAIL_TEMPLATES: drop public read; admin-only writes already exist
DROP POLICY IF EXISTS "Anyone can read email templates" ON public.email_templates;

CREATE POLICY "Admins can read email templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) PARTNERS: drop public read of full row; add slug resolver helper
DROP POLICY IF EXISTS "Anyone can read active partners" ON public.partners;

CREATE OR REPLACE FUNCTION public.resolve_partner_by_slug(p_slug text)
RETURNS TABLE(
  id uuid,
  slug text,
  display_name text,
  parent_partner_id uuid,
  status partner_status,
  avatar_url text,
  landing_path text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.slug, p.display_name, p.parent_partner_id, p.status, p.avatar_url, p.landing_path
    FROM public.partners p
   WHERE lower(p.slug) = lower(trim(p_slug))
     AND p.status = 'active'
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_partner_by_slug(text) TO anon, authenticated;
