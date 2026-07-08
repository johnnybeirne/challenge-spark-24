
CREATE TABLE public.results_advisor_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL UNIQUE CHECK (tier IN ('low','mid','high')),
  prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.results_advisor_prompts TO anon, authenticated;
GRANT ALL ON public.results_advisor_prompts TO authenticated;
GRANT ALL ON public.results_advisor_prompts TO service_role;

ALTER TABLE public.results_advisor_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read advisor prompts"
  ON public.results_advisor_prompts FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert advisor prompts"
  ON public.results_advisor_prompts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update advisor prompts"
  ON public.results_advisor_prompts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete advisor prompts"
  ON public.results_advisor_prompts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_results_advisor_prompts_updated_at
  BEFORE UPDATE ON public.results_advisor_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.results_advisor_prompts (tier, prompts) VALUES
  ('low', '["What is the very first thing I should focus on to get leads?","How do I get clear on who I actually help?","How does the 3-Day Challenge help someone at my stage?"]'::jsonb),
  ('mid', '["How do I turn scattered activity into a repeatable lead flow?","What should I fix first: my offer, my audience, or my follow-up?","How does the 3-Day Challenge help me tighten what I already have?"]'::jsonb),
  ('high', '["How do I get more leverage from the audience I already have?","What is the fastest way to add a referral loop to what I do?","How does the 3-Day Challenge help someone already getting results?"]'::jsonb);
