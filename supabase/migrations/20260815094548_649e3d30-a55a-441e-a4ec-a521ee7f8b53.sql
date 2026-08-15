ALTER TABLE public.user_memory
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS problem text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT '';

-- One time backfill from the Day 1 wizard draft stored in challenge_progress.ai_outputs->>'day1Setup'
UPDATE public.user_memory um
SET audience = COALESCE(NULLIF(um.audience, ''), COALESCE(s.audience, '')),
    problem  = COALESCE(NULLIF(um.problem, ''),  COALESCE(s.problem, '')),
    method   = COALESCE(NULLIF(um.method, ''),   COALESCE(s.how, '')),
    updated_at = now()
FROM (
  SELECT cp.user_id,
         (cp.ai_outputs->>'day1Setup')::jsonb ->> 'audience' AS audience,
         (cp.ai_outputs->>'day1Setup')::jsonb ->> 'problem'  AS problem,
         (cp.ai_outputs->>'day1Setup')::jsonb ->> 'how'      AS how
  FROM public.challenge_progress cp
  WHERE cp.ai_outputs ? 'day1Setup'
    AND jsonb_typeof(cp.ai_outputs->'day1Setup') = 'string'
    AND left(btrim(cp.ai_outputs->>'day1Setup'), 1) = '{'
) s
WHERE s.user_id = um.user_id
  AND (um.audience = '' OR um.problem = '' OR um.method = '');

-- Roadmap: move from day based keys to pillar based keys
UPDATE public.site_content SET key = 'pillar1_label', label = 'Pillar 1 label', sort_order = 3 WHERE page='dashboard' AND section='roadmap' AND key='day1_label';
UPDATE public.site_content SET key = 'pillar1_title', label = 'Pillar 1 title', sort_order = 4 WHERE page='dashboard' AND section='roadmap' AND key='day1_title';
UPDATE public.site_content SET key = 'pillar1_copy',  label = 'Pillar 1 description template', sort_order = 5 WHERE page='dashboard' AND section='roadmap' AND key='day1_copy';
UPDATE public.site_content SET key = 'pillar2_label', label = 'Pillar 2 label', sort_order = 6 WHERE page='dashboard' AND section='roadmap' AND key='day2_label';
UPDATE public.site_content SET key = 'pillar2_title', label = 'Pillar 2 title', sort_order = 7 WHERE page='dashboard' AND section='roadmap' AND key='day2_title';
UPDATE public.site_content SET key = 'pillar2_copy',  label = 'Pillar 2 description template', sort_order = 8 WHERE page='dashboard' AND section='roadmap' AND key='day2_copy';
UPDATE public.site_content SET key = 'pillar3_label', label = 'Pillar 3 label', sort_order = 9 WHERE page='dashboard' AND section='roadmap' AND key='day3_label';
UPDATE public.site_content SET key = 'pillar3_title', label = 'Pillar 3 title', sort_order = 10 WHERE page='dashboard' AND section='roadmap' AND key='day3_title';
UPDATE public.site_content SET key = 'pillar3_copy',  label = 'Pillar 3 description template', sort_order = 11 WHERE page='dashboard' AND section='roadmap' AND key='day3_copy';

-- Fixed pillar labels and titles
UPDATE public.site_content SET value = 'Pillar 1' WHERE page='dashboard' AND section='roadmap' AND key='pillar1_label';
UPDATE public.site_content SET value = 'Pillar 2' WHERE page='dashboard' AND section='roadmap' AND key='pillar2_label';
UPDATE public.site_content SET value = 'Pillar 3' WHERE page='dashboard' AND section='roadmap' AND key='pillar3_label';
UPDATE public.site_content SET value = 'Create your challenge.' WHERE page='dashboard' AND section='roadmap' AND key='pillar1_title';
UPDATE public.site_content SET value = 'Create a quiz that leads into your challenge.' WHERE page='dashboard' AND section='roadmap' AND key='pillar2_title';
UPDATE public.site_content SET value = 'Create a referral loop so your challenge grows through the people doing it.' WHERE page='dashboard' AND section='roadmap' AND key='pillar3_title';

-- Personalised description templates. Tokens: {audience} {problem} {method}
UPDATE public.site_content SET value = 'Your challenge is built for {audience}. It takes the problem you keep seeing, {problem}, and turns {method} into a guided sequence they can follow.' WHERE page='dashboard' AND section='roadmap' AND key='pillar1_copy';
UPDATE public.site_content SET value = 'Your quiz shows {audience} where they stand with {problem}. Their answers lead them straight into your challenge, so the invitation feels obvious.' WHERE page='dashboard' AND section='roadmap' AND key='pillar2_copy';
UPDATE public.site_content SET value = 'Every person who finishes gets a simple reason to bring someone like them along. Your challenge then grows through {audience} sharing it, rather than you chasing new names.' WHERE page='dashboard' AND section='roadmap' AND key='pillar3_copy';

UPDATE public.site_content SET value = 'Here are the three pillars you build, in sequence.' WHERE page='dashboard' AND section='roadmap' AND key='intro' AND value = 'Here is what you build across the three days, in sequence.';

-- Fallback wording when a participant answer is missing
INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order, column_slot)
VALUES
  ('dashboard','roadmap','fallback_audience','your audience','text','Fallback: audience',12,'full'),
  ('dashboard','roadmap','fallback_problem','the problem you solve','text','Fallback: problem',13,'full'),
  ('dashboard','roadmap','fallback_method','the way you solve it','text','Fallback: method',14,'full')
ON CONFLICT DO NOTHING;