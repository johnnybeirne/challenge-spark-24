
-- Approve a single pending commission
CREATE OR REPLACE FUNCTION public.admin_approve_commission(p_commission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE public.commissions
    SET status = 'approved', approved_at = now(), updated_at = now()
    WHERE id = p_commission_id AND status = 'pending';
END;
$$;

-- Bulk approve all pending commissions for a partner
CREATE OR REPLACE FUNCTION public.admin_approve_partner_commissions(p_partner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  WITH upd AS (
    UPDATE public.commissions
       SET status = 'approved', approved_at = now(), updated_at = now()
     WHERE partner_id = p_partner_id AND status = 'pending'
     RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$$;

-- Create a payout from selected approved commissions for one partner
CREATE OR REPLACE FUNCTION public.admin_create_payout(
  p_partner_id uuid,
  p_commission_ids uuid[],
  p_method text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout_id uuid;
  v_total_cents integer;
  v_currency text;
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_commission_ids IS NULL OR array_length(p_commission_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No commissions selected';
  END IF;

  -- Validate: all belong to partner, status approved, no payout_id
  SELECT count(*), COALESCE(sum(amount_cents), 0)
    INTO v_count, v_total_cents
    FROM public.commissions
   WHERE id = ANY(p_commission_ids)
     AND partner_id = p_partner_id
     AND status = 'approved'
     AND payout_id IS NULL;

  IF v_count <> array_length(p_commission_ids, 1) THEN
    RAISE EXCEPTION 'One or more commissions are invalid (wrong partner, not approved, or already in a payout)';
  END IF;

  v_currency := 'eur';

  INSERT INTO public.payouts (partner_id, total_cents, currency, status, method, reference, notes)
  VALUES (p_partner_id, v_total_cents, v_currency, 'pending', p_method, p_reference, p_notes)
  RETURNING id INTO v_payout_id;

  UPDATE public.commissions
     SET payout_id = v_payout_id, updated_at = now()
   WHERE id = ANY(p_commission_ids);

  RETURN v_payout_id;
END;
$$;

-- Mark payout as paid; cascades to attached commissions
CREATE OR REPLACE FUNCTION public.admin_mark_payout_paid(
  p_payout_id uuid,
  p_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.payouts
     SET status = 'paid',
         paid_at = now(),
         reference = COALESCE(p_reference, reference),
         updated_at = now()
   WHERE id = p_payout_id AND status <> 'paid';

  UPDATE public.commissions
     SET status = 'paid', paid_at = now(), updated_at = now()
   WHERE payout_id = p_payout_id AND status <> 'paid';
END;
$$;

-- Void a pending payout (release commissions back to approved)
CREATE OR REPLACE FUNCTION public.admin_void_payout(p_payout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.payouts WHERE id = p_payout_id AND status = 'paid') THEN
    RAISE EXCEPTION 'Cannot void a payout that has already been paid';
  END IF;

  UPDATE public.commissions
     SET payout_id = NULL, updated_at = now()
   WHERE payout_id = p_payout_id;

  UPDATE public.payouts
     SET status = 'failed', updated_at = now()
   WHERE id = p_payout_id;
END;
$$;
