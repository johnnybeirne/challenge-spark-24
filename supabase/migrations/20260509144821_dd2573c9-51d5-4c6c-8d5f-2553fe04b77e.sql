
-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  original_price integer NOT NULL DEFAULT 497,
  final_price integer NOT NULL DEFAULT 0,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all coupons"
  ON public.coupons FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert coupons"
  ON public.coupons FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons"
  ON public.coupons FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons"
  ON public.coupons FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track coupon used on a purchase
ALTER TABLE public.purchases ADD COLUMN coupon_code text;

-- Helper to atomically record a redemption (used when coupon applied client-side, no payment)
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(p_code) FOR UPDATE;
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

  UPDATE public.coupons
    SET redemption_count = redemption_count + 1
    WHERE id = c.id;

  RETURN jsonb_build_object(
    'ok', true,
    'code', c.code,
    'label', c.label,
    'final_price', c.final_price,
    'original_price', c.original_price
  );
END;
$$;

-- Seed existing FOUNDING497 coupon for continuity
INSERT INTO public.coupons (code, label, original_price, final_price, is_active)
VALUES ('FOUNDING497', 'Founding member', 497, 0, true)
ON CONFLICT (code) DO NOTHING;
