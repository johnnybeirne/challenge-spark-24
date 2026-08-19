INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order)
SELECT v.page, v.section, v.key, v.value, 'text', v.label, v.sort_order
FROM (VALUES
  ('day2','buttons','retake_quiz','Take the quiz for this challenge again','Retake quiz button',1),
  ('day2','buttons','generate_locked','Mark 1, 2 & 3 as read to generate your quiz','Generate quiz — locked state',2),
  ('day2','buttons','generate_unlocked','Generate your quiz now','Generate quiz — unlocked state',3),
  ('day2','buttons','generate_busy','Generating your quiz...','Generating (busy) label',4),
  ('day2','buttons','upsell','Check Out Premium Membership','Premium upsell button',5)
) AS v(page,section,key,value,label,sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content sc
  WHERE sc.page = v.page AND sc.section = v.section AND sc.key = v.key
);

DELETE FROM public.admin_page_tags WHERE page_key = '/owner-console/day2-buttons';

INSERT INTO public.admin_page_tags (page_key, label, tags)
VALUES ('/owner-console/day2-button-copy', 'Day 2 Buttons', 'day 2 buttons, generate quiz, retake quiz, upsell, button labels, day 2 cta, premium membership button')
ON CONFLICT (page_key) DO UPDATE SET label = EXCLUDED.label, tags = EXCLUDED.tags;