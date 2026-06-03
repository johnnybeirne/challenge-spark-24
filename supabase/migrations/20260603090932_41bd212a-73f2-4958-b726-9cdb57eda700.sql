CREATE TABLE public.day2_button_labels (
  id text PRIMARY KEY,
  screen text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.day2_button_labels TO anon, authenticated;
GRANT ALL ON public.day2_button_labels TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.day2_button_labels TO authenticated;

ALTER TABLE public.day2_button_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read day2 button labels"
  ON public.day2_button_labels FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert day2 button labels"
  ON public.day2_button_labels FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update day2 button labels"
  ON public.day2_button_labels FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete day2 button labels"
  ON public.day2_button_labels FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.day2_button_labels (id, screen, sort_order, label) VALUES
  ('s1_audience_fit',       'screen_1', 1, 'Why a quiz works for [audience]'),
  ('s1_problem_gap',        'screen_1', 2, 'How a quiz reveals [problem] they can''t see'),
  ('s1_share_trigger',      'screen_1', 3, 'What makes [audience] share their quiz result'),
  ('s1_superpower_question','screen_1', 4, 'How [superpower] becomes a quiz question'),
  ('s1_buy_decision',       'screen_1', 5, 'Why [audience] invest after taking a quiz');
