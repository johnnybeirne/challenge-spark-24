
CREATE TABLE public.quiz_questions (
  id text NOT NULL PRIMARY KEY,
  position integer NOT NULL,
  text text NOT NULL,
  option_yes_label text NOT NULL DEFAULT 'Yes',
  option_no_label text NOT NULL DEFAULT 'No',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz questions"
ON public.quiz_questions FOR SELECT
USING (true);

CREATE POLICY "Admins can insert quiz questions"
ON public.quiz_questions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update quiz questions"
ON public.quiz_questions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete quiz questions"
ON public.quiz_questions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.quiz_questions (id, position, text) VALUES
('q1', 1, 'Do you have a reliable way to generate leads that doesn''t depend on constant effort?'),
('q2', 2, 'If you stopped promoting or publishing content, would your leads drop off?'),
('q3', 3, 'Can you clearly identify what is driving most of your leads?'),
('q4', 4, 'Are most of your leads already trusting you before you speak to them?'),
('q5', 5, 'Do you have a system that encourages people to invite others they know?'),
('q6', 6, 'Is your lead magnet the same for everyone who finds you?'),
('q7', 7, 'When someone becomes a lead, do they know exactly what to do next?'),
('q8', 8, 'Do you have something that continues to bring in leads after it''s been set up?'),
('q9', 9, 'Do your leads only come in when you are actively working on it?');
