-- Add an admin-controllable on/off switch for the welcome email automation
ALTER TABLE internal.welcome_hook_config
  ADD COLUMN IF NOT EXISTS auto_send_enabled boolean NOT NULL DEFAULT true;

-- Update trigger to honor the toggle
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, extensions
AS $function$
DECLARE
  v_has_welcome boolean;
  v_suppressed boolean;
  v_secret text;
  v_url text;
  v_enabled boolean;
BEGIN
  SELECT secret, function_url, auto_send_enabled
    INTO v_secret, v_url, v_enabled
    FROM internal.welcome_hook_config WHERE id = 1;

  IF v_secret IS NULL OR v_url IS NULL THEN RETURN NEW; END IF;
  IF COALESCE(v_enabled, false) = false THEN RETURN NEW; END IF;

  SELECT EXISTS(SELECT 1 FROM public.newsletter_templates WHERE is_welcome = true) INTO v_has_welcome;
  IF NOT v_has_welcome THEN RETURN NEW; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.newsletter_suppressions WHERE lower(email) = lower(NEW.email)
  ) INTO v_suppressed;
  IF v_suppressed THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-welcome-secret', v_secret
    ),
    body := jsonb_build_object('signupId', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

-- Admin RPCs to read/update the toggle (the table itself is locked down to service_role)
CREATE OR REPLACE FUNCTION public.get_welcome_auto_send()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $$
DECLARE v boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT auto_send_enabled INTO v FROM internal.welcome_hook_config WHERE id = 1;
  RETURN COALESCE(v, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_welcome_auto_send(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  UPDATE internal.welcome_hook_config SET auto_send_enabled = p_enabled WHERE id = 1;
  RETURN p_enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_welcome_auto_send() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_welcome_auto_send(boolean) TO authenticated;