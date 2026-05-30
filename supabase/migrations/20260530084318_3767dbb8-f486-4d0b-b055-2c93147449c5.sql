
INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order) VALUES
  ('landing', 'faq', 'item_1_q', 'How long does the quiz take?', 'text', 'Q1 — Question', 10),
  ('landing', 'faq', 'item_1_a', 'About 2 minutes. Nine quick questions, no signup required to see your diagnosis.', 'textarea', 'Q1 — Answer', 11),
  ('landing', 'faq', 'item_2_q', 'Who is this for?', 'text', 'Q2 — Question', 20),
  ('landing', 'faq', 'item_2_a', 'Coaches, consultants, authors, and creators who want more consistent leads without guessing what to fix.', 'textarea', 'Q2 — Answer', 21),
  ('landing', 'faq', 'item_3_q', 'What do I get at the end?', 'text', 'Q3 — Question', 30),
  ('landing', 'faq', 'item_3_a', 'A clear diagnosis of where your lead flow is leaking and a recommended next step based on your answers.', 'textarea', 'Q3 — Answer', 31),
  ('landing', 'faq', 'item_4_q', 'Do I have to pay?', 'text', 'Q4 — Question', 40),
  ('landing', 'faq', 'item_4_a', 'No. The diagnosis is free. You only continue into the paid challenge if it fits what you need next.', 'textarea', 'Q4 — Answer', 41)
ON CONFLICT DO NOTHING;

UPDATE public.site_content SET value = 'Frequently asked questions', sort_order = 0
  WHERE page = 'landing' AND section = 'faq' AND key = 'title' AND value = 'Questions';
