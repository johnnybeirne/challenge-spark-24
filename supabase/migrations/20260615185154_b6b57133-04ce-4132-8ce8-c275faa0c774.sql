INSERT INTO public.quiz_preview_tips (key, tip) VALUES
  ('problem_section', 'This section mirrors back the exact problem your audience feels, so they think "yes — that''s me." We use the problem you described on Day 1.'),
  ('pain_guessing', 'The first pain: they sense something is wrong but can''t name the real cause. Naming it for them builds instant trust.'),
  ('pain_generic', 'The second pain: generic advice from gurus doesn''t fit their specific situation. This card positions your quiz as the personalised alternative.'),
  ('pain_wasted', 'The third pain: effort spent on the wrong things. This card hints at the outcome they actually want, pulled from your Day 1 answers.')
ON CONFLICT (key) DO NOTHING;
