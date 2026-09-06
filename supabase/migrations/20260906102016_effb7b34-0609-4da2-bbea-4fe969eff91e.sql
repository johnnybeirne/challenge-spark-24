CREATE OR REPLACE FUNCTION public.check_guest_pass(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
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
  RETURN jsonb_build_object('valid', true, 'label', p.label);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_guest_pass(text) TO anon, authenticated;