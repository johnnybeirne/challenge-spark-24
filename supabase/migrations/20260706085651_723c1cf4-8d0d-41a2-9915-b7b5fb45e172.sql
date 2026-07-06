
CREATE TABLE public.milestone_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone text NOT NULL,
  resend_id text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT milestone_email_log_user_milestone_unique UNIQUE (user_id, milestone)
);

GRANT ALL ON public.milestone_email_log TO service_role;

ALTER TABLE public.milestone_email_log ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service role (which bypasses RLS) can access.
