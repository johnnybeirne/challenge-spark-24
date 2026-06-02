-- Newsletter settings (single-row config for the edge functions)
CREATE TABLE public.newsletter_settings (
  id integer PRIMARY KEY DEFAULT 1,
  app_base_url text NOT NULL DEFAULT 'https://leadio.johnnybeirne.com',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.newsletter_settings TO anon, authenticated;
GRANT ALL ON public.newsletter_settings TO service_role;
ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read newsletter settings" ON public.newsletter_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage newsletter settings" ON public.newsletter_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.newsletter_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Unsubscribe page config (single row, public read)
CREATE TABLE public.unsubscribe_page_config (
  id integer PRIMARY KEY DEFAULT 1,
  ready_heading text NOT NULL DEFAULT 'Unsubscribe',
  ready_body text NOT NULL DEFAULT 'Click below to stop receiving emails at {{email}}.',
  confirm_button_label text NOT NULL DEFAULT 'Confirm unsubscribe',
  done_heading text NOT NULL DEFAULT 'You''re unsubscribed',
  done_body text NOT NULL DEFAULT '{{email}} won''t receive any more emails from us.',
  already_heading text NOT NULL DEFAULT 'Already unsubscribed',
  already_body text NOT NULL DEFAULT '{{email}} is already opted out.',
  error_heading text NOT NULL DEFAULT 'Link error',
  error_body text NOT NULL DEFAULT 'This unsubscribe link is invalid or has expired.',
  feedback_enabled boolean NOT NULL DEFAULT true,
  feedback_prompt text NOT NULL DEFAULT 'Mind sharing why you''re leaving? (optional)',
  feedback_placeholder text NOT NULL DEFAULT 'Too many emails, not relevant, etc.',
  feedback_submit_label text NOT NULL DEFAULT 'Send feedback',
  feedback_skip_label text NOT NULL DEFAULT 'Skip',
  resubscribe_enabled boolean NOT NULL DEFAULT true,
  resubscribe_label text NOT NULL DEFAULT 'Changed your mind? Resubscribe',
  resubscribe_success text NOT NULL DEFAULT 'Welcome back — {{email}} is subscribed again.',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unsubscribe_page_config_singleton CHECK (id = 1)
);
GRANT SELECT ON public.unsubscribe_page_config TO anon, authenticated;
GRANT ALL ON public.unsubscribe_page_config TO service_role;
ALTER TABLE public.unsubscribe_page_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unsubscribe page config" ON public.unsubscribe_page_config FOR SELECT USING (true);
CREATE POLICY "Admins manage unsubscribe page config" ON public.unsubscribe_page_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.unsubscribe_page_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Feedback table
CREATE TABLE public.unsubscribe_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.unsubscribe_feedback TO authenticated;
GRANT ALL ON public.unsubscribe_feedback TO service_role;
ALTER TABLE public.unsubscribe_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read unsubscribe feedback" ON public.unsubscribe_feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));