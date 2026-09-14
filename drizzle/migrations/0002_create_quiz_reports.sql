CREATE TABLE public.quiz_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  assessment jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '365 days'),
  last_viewed_at timestamptz
);

CREATE INDEX quiz_reports_email_idx ON public.quiz_reports (email);

GRANT ALL ON public.quiz_reports TO service_role;

ALTER TABLE public.quiz_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view quiz reports"
ON public.quiz_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.quiz_reports TO authenticated;