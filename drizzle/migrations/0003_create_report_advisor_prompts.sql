CREATE TABLE public.report_advisor_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.report_advisor_prompts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_advisor_prompts TO authenticated;
GRANT ALL ON public.report_advisor_prompts TO service_role;

ALTER TABLE public.report_advisor_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read report advisor prompts"
  ON public.report_advisor_prompts FOR SELECT
  USING (true);

CREATE POLICY "Admins manage report advisor prompts"
  ON public.report_advisor_prompts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.report_advisor_prompts (prompt, position) VALUES
  ('Why is my system score holding me back?', 0),
  ('What should I fix first?', 1),
  ('How do I get the right people to notice me?', 2),
  ('What would a simple follow-up sequence look like?', 3);