
-- ============ ENUMS ============
CREATE TYPE public.partner_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.commission_kind AS ENUM ('percent', 'fixed');
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'revoked');
CREATE TYPE public.payout_status AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE public.attribution_source AS ENUM ('query_param', 'partner_landing', 'invite_link', 'coupon', 'manual');

-- ============ PARTNERS ============
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  status public.partner_status NOT NULL DEFAULT 'active',
  default_commission_type public.commission_kind NOT NULL DEFAULT 'percent',
  default_commission_value numeric NOT NULL DEFAULT 30,
  parent_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  manual_score_adjustment integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_partners_slug ON public.partners(lower(slug));
CREATE INDEX idx_partners_parent ON public.partners(parent_partner_id);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active partners"
  ON public.partners FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owner can read own partner"
  ON public.partners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all partners"
  ON public.partners FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can update own partner"
  ON public.partners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update partners"
  ON public.partners FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert partners"
  ON public.partners FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can insert own partner"
  ON public.partners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete partners"
  ON public.partners FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REFERRAL ATTRIBUTIONS ============
CREATE TABLE public.referral_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  partner_slug text NOT NULL,
  parent_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  landing_path text,
  landing_query jsonb DEFAULT '{}'::jsonb,
  source public.attribution_source NOT NULL DEFAULT 'query_param',
  first_touch_at timestamptz NOT NULL DEFAULT now(),
  bound_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attr_partner ON public.referral_attributions(partner_id);
CREATE INDEX idx_attr_parent ON public.referral_attributions(parent_partner_id);

ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own attribution"
  ON public.referral_attributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Partners see attributions to them"
  ON public.referral_attributions FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
      OR parent_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all attributions"
  ON public.referral_attributions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write attributions"
  ON public.referral_attributions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ COMMISSIONS ============
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  commission_type public.commission_kind NOT NULL,
  commission_value_snapshot numeric NOT NULL,
  level integer NOT NULL DEFAULT 1,
  status public.commission_status NOT NULL DEFAULT 'pending',
  payout_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_commissions_partner ON public.commissions(partner_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_payout ON public.commissions(payout_id);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners see own commissions"
  ON public.commissions FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all commissions"
  ON public.commissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write commissions"
  ON public.commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PAYOUTS ============
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  status public.payout_status NOT NULL DEFAULT 'pending',
  method text,
  reference text,
  notes text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_partner ON public.payouts(partner_id);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners see own payouts"
  ON public.payouts FOR SELECT
  USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins read all payouts"
  ON public.payouts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write payouts"
  ON public.payouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.commissions
  ADD CONSTRAINT fk_commissions_payout
  FOREIGN KEY (payout_id) REFERENCES public.payouts(id) ON DELETE SET NULL;

-- ============ PARTNER INVITES ============
CREATE TABLE public.partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  invitee_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
CREATE INDEX idx_partner_invites_inviter ON public.partner_invites(inviter_partner_id);
CREATE INDEX idx_partner_invites_email ON public.partner_invites(lower(invitee_email));

ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter sees own invites"
  ON public.partner_invites FOR SELECT
  USING (inviter_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Inviter creates invites"
  ON public.partner_invites FOR INSERT
  WITH CHECK (inviter_partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage invites"
  ON public.partner_invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ EXTEND COUPONS ============
ALTER TABLE public.coupons
  ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN commission_type public.commission_kind,
  ADD COLUMN commission_value numeric;

-- ============ BACKFILL ============
INSERT INTO public.partners (user_id, slug, status, created_at)
SELECT
  p.user_id,
  p.partner_code,
  CASE WHEN p.is_approved THEN 'active'::public.partner_status
       ELSE 'pending'::public.partner_status END,
  p.created_at
FROM public.promoters p
WHERE p.user_id IS NOT NULL
  AND p.partner_code IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.referral_attributions (
  user_id, partner_id, partner_slug, source, first_touch_at, bound_at
)
SELECT DISTINCT ON (pr.user_id)
  pr.user_id,
  pa.id,
  pa.slug,
  'query_param'::public.attribution_source,
  pr.created_at,
  pr.created_at
FROM public.profiles pr
JOIN public.partners pa ON pa.slug = pr.partner_code_used
WHERE pr.partner_code_used IS NOT NULL
ORDER BY pr.user_id, pr.created_at ASC
ON CONFLICT (user_id) DO NOTHING;

-- ============ ADMIN RPCs ============
CREATE OR REPLACE FUNCTION public.admin_reassign_attribution(
  p_user_id uuid,
  p_new_partner_slug text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_partner record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT id, slug, parent_partner_id INTO v_partner
  FROM public.partners WHERE slug = p_new_partner_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Partner not found'; END IF;

  INSERT INTO public.referral_attributions (
    user_id, partner_id, partner_slug, parent_partner_id, source
  ) VALUES (
    p_user_id, v_partner.id, v_partner.slug, v_partner.parent_partner_id, 'manual'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET partner_id = EXCLUDED.partner_id,
        partner_slug = EXCLUDED.partner_slug,
        parent_partner_id = EXCLUDED.parent_partner_id,
        source = 'manual',
        bound_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_commission(p_commission_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.commissions
    SET status = 'revoked', revoked_at = now(),
        notes = COALESCE(notes, '') || CASE WHEN p_reason IS NULL THEN '' ELSE E'\n[revoked] ' || p_reason END
    WHERE id = p_commission_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_merge_partners(p_keep uuid, p_remove uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_keep = p_remove THEN RAISE EXCEPTION 'Cannot merge partner into itself'; END IF;

  UPDATE public.referral_attributions SET partner_id = p_keep,
         partner_slug = (SELECT slug FROM public.partners WHERE id = p_keep)
   WHERE partner_id = p_remove;
  UPDATE public.referral_attributions SET parent_partner_id = p_keep
   WHERE parent_partner_id = p_remove;
  UPDATE public.commissions SET partner_id = p_keep WHERE partner_id = p_remove;
  UPDATE public.payouts SET partner_id = p_keep WHERE partner_id = p_remove;
  UPDATE public.partners SET parent_partner_id = p_keep WHERE parent_partner_id = p_remove;
  UPDATE public.partner_invites SET inviter_partner_id = p_keep WHERE inviter_partner_id = p_remove;

  UPDATE public.partners SET status = 'suspended',
         slug = slug || '_merged_' || substr(p_remove::text, 1, 8)
   WHERE id = p_remove;
END $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_partner_score(p_partner_id uuid, p_delta integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.partners
    SET manual_score_adjustment = manual_score_adjustment + p_delta
    WHERE id = p_partner_id;
END $$;

-- ============ LEADERBOARD VIEW ============
CREATE OR REPLACE VIEW public.partner_leaderboard AS
SELECT
  p.id AS partner_id,
  p.slug,
  p.display_name,
  p.status,
  p.manual_score_adjustment,
  COALESCE(s.signups, 0) AS signups,
  COALESCE(s.signups, 0) + p.manual_score_adjustment AS total_score
FROM public.partners p
LEFT JOIN (
  SELECT partner_id, COUNT(*)::int AS signups
  FROM public.referral_attributions
  GROUP BY partner_id
) s ON s.partner_id = p.id
WHERE p.status = 'active';
