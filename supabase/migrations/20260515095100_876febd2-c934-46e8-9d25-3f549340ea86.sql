
-- Campaigns
CREATE TABLE public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html_body text NOT NULL,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  unsubscribe_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.newsletter_campaigns
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_newsletter_campaigns_updated
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sends
CREATE TABLE public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  resend_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_newsletter_sends_campaign ON public.newsletter_sends(campaign_id);
CREATE INDEX idx_newsletter_sends_email ON public.newsletter_sends(email);
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sends" ON public.newsletter_sends
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Suppressions
CREATE TABLE public.newsletter_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source_campaign_id uuid REFERENCES public.newsletter_campaigns(id) ON DELETE SET NULL,
  unsubscribed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suppressions" ON public.newsletter_suppressions
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Unsubscribe tokens (no client access — service role only)
CREATE TABLE public.newsletter_unsubscribe_tokens (
  token text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
-- No policies = no client access; service role bypasses RLS.
