INSERT INTO public.quiz_preview_tips (key, tip) VALUES
  ('audience_eyebrow', 'This eyebrow names exactly who the quiz is for so the right person self-selects in. We pull the audience you described on Day 1.')
ON CONFLICT (key) DO NOTHING;
