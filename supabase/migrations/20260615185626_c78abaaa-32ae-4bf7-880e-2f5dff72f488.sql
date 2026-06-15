INSERT INTO public.quiz_preview_tips (key, tip) VALUES
  ('reveals_section', 'This section sets expectations for what the quiz delivers. Keep the bullets generic so the actual result categories stay a surprise until the visitor takes the quiz.')
ON CONFLICT (key) DO NOTHING;
