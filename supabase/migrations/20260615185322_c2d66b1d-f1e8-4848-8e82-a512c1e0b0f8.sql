INSERT INTO public.quiz_preview_tips (key, tip) VALUES
  ('problem_paragraph', 'This line names your audience and the root cause. It tells visitors that surface-level fixes won''t work — only diagnosing the real cause (which the quiz does) will.')
ON CONFLICT (key) DO NOTHING;
