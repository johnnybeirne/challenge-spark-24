CREATE TABLE public.guest_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_passes TO authenticated;
GRANT ALL ON public.guest_passes TO service_role;

ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage guest passes"
ON public.guest_passes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.redeem_guest_pass(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.guest_passes;
BEGIN
  SELECT * INTO p FROM public.guest_passes WHERE token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  IF p.revoked THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;
  IF p.expires_at IS NOT NULL AND p.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  IF p.max_uses > 0 AND p.uses >= p.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'used_up');
  END IF;

  UPDATE public.guest_passes
     SET uses = uses + 1, last_used_at = now()
   WHERE id = p.id;

  RETURN jsonb_build_object('valid', true, 'label', p.label);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_guest_pass(text) TO anon, authenticated;