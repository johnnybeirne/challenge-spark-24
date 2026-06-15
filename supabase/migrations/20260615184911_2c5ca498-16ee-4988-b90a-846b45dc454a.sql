CREATE TABLE public.quiz_preview_tips (
  key text PRIMARY KEY,
  tip text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_preview_tips TO anon, authenticated;
GRANT ALL ON public.quiz_preview_tips TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.quiz_preview_tips TO authenticated;

ALTER TABLE public.quiz_preview_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read quiz preview tips"
  ON public.quiz_preview_tips FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert quiz preview tips"
  ON public.quiz_preview_tips FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update quiz preview tips"
  ON public.quiz_preview_tips FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete quiz preview tips"
  ON public.quiz_preview_tips FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quiz_preview_tips_updated_at
  BEFORE UPDATE ON public.quiz_preview_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.quiz_preview_tips (key, tip) VALUES
  ('hero_headline', 'This headline leads with the specific frustration your audience feels. We pull a short version of the problem you described on Day 1 so visitors instantly recognise themselves.'),
  ('subheading', 'This line sets expectations: a quick two-minute quiz with a personalised result. Keep it generic so it works across every quiz topic.');
