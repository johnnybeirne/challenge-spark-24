-- Ensure pg_net is available for the welcome-email trigger
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================
-- Newsletter templates
-- ============================
CREATE TABLE public.newsletter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  is_welcome boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- At most one welcome template
CREATE UNIQUE INDEX newsletter_templates_one_welcome
  ON public.newsletter_templates ((is_welcome)) WHERE is_welcome = true;

ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates"
  ON public.newsletter_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_newsletter_templates_updated_at
  BEFORE UPDATE ON public.newsletter_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- Allow newsletter_sends to log welcome (no campaign) sends
-- ============================
ALTER TABLE public.newsletter_sends ALTER COLUMN campaign_id DROP NOT NULL;
ALTER TABLE public.newsletter_sends ADD COLUMN template_id uuid;

-- ============================
-- Internal config table for welcome hook (private schema, service-role only)
-- ============================
CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA internal TO service_role;

CREATE TABLE IF NOT EXISTS internal.welcome_hook_config (
  id int PRIMARY KEY DEFAULT 1,
  secret text NOT NULL,
  function_url text NOT NULL,
  CONSTRAINT singleton CHECK (id = 1)
);
REVOKE ALL ON internal.welcome_hook_config FROM public, anon, authenticated;
GRANT SELECT ON internal.welcome_hook_config TO service_role;

-- ============================
-- Trigger: enqueue welcome email on new waitlist signup
-- ============================
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal, extensions
AS $$
DECLARE
  v_has_welcome boolean;
  v_suppressed boolean;
  v_secret text;
  v_url text;
BEGIN
  -- Skip silently if no welcome template is configured
  SELECT EXISTS(SELECT 1 FROM public.newsletter_templates WHERE is_welcome = true) INTO v_has_welcome;
  IF NOT v_has_welcome THEN RETURN NEW; END IF;

  -- Skip if recipient is on the suppression list
  SELECT EXISTS(
    SELECT 1 FROM public.newsletter_suppressions WHERE lower(email) = lower(NEW.email)
  ) INTO v_suppressed;
  IF v_suppressed THEN RETURN NEW; END IF;

  SELECT secret, function_url INTO v_secret, v_url
    FROM internal.welcome_hook_config WHERE id = 1;
  IF v_secret IS NULL OR v_url IS NULL THEN RETURN NEW; END IF;

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
  -- Never block signup on email failure
  RETURN NEW;
END;
$$;

CREATE TRIGGER waitlist_welcome_email_trigger
  AFTER INSERT ON public.waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION public.trigger_welcome_email();