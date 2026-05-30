
-- Reset landing CMS content (keep FAQ) and seed defaults that match the current live copy.
DELETE FROM public.site_content WHERE page = 'landing' AND section <> 'faq';

INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order) VALUES
-- HERO
('landing','hero','eyebrow','Built for coaches, consultants, and authors who want more leads','text','Eyebrow (small uppercase line above headline)',10),
('landing','hero','headline','Find out why your leads are inconsistent','text','Main headline',20),
('landing','hero','subhead','Answer nine quick questions and get a recommended strategy based on your answers. Instantly','text','Sub-headline under main headline',30),
('landing','hero','cta_label','Start the quiz','text','Primary button label',40),
('landing','hero','cta_note','No signup required to get your diagnosis.','text','Small note next to button',50),
('landing','hero','image_overlay_eyebrow','The real question','text','Overlay card eyebrow',60),
('landing','hero','image_overlay_text','Is your lead flow inconsistent because of attention, trust, conversion, or follow-up?','text','Overlay card text',70),

-- PROBLEM
('landing','problem','eyebrow','The problem','text','Eyebrow',10),
('landing','problem','title','Lead flow should not feel like guesswork','text','Section title',20),
('landing','problem','body','When leads are inconsistent, most people try to do more. The better move is to diagnose what is actually missing.','text','Section body',30),
('landing','problem','item_1','Some weeks bring enquiries. Other weeks go quiet.','text','Problem 1',40),
('landing','problem','item_2','You post, message, tweak, and still cannot tell what caused the result.','text','Problem 2',50),
('landing','problem','item_3','More effort can hide the real bottleneck instead of fixing it.','text','Problem 3',60),

-- REVEAL
('landing','reveal','eyebrow','What the quiz reveals','text','Eyebrow',10),
('landing','reveal','title','Your inconsistency usually has one primary cause','text','Section title',20),
('landing','reveal','item_1','You are not getting enough of the right attention','text','Cause 1',30),
('landing','reveal','item_2','People notice you but do not trust the next step','text','Cause 2',40),
('landing','reveal','item_3','Interest exists but conversion is unclear','text','Cause 3',50),
('landing','reveal','item_4','Follow-up depends too heavily on manual effort','text','Cause 4',60),

-- SCORE PREVIEW
('landing','score','eyebrow','Your result','text','Eyebrow',10),
('landing','score','title','Get a clear diagnosis, then a recommended strategy','text','Section title',20),
('landing','score','percent','76','text','Score % shown in donut (number only)',30),
('landing','score','percent_label','System readiness','text','Label under percent',40),
('landing','score','item_1','Where your leads are leaking','text','Bullet 1',50),
('landing','score','item_2','What system gap matters most','text','Bullet 2',60),
('landing','score','item_3','What to do next based on your answers','text','Bullet 3',70),

-- BENEFITS
('landing','benefits','eyebrow','Why take it','text','Eyebrow',10),
('landing','benefits','title','Know what to fix before you spend more effort','text','Section title',20),
('landing','benefits','item_1','Replace vague advice with a diagnosis','text','Benefit 1',30),
('landing','benefits','item_2','See whether effort or system is the issue','text','Benefit 2',40),
('landing','benefits','item_3','Understand your next practical move','text','Benefit 3',50),
('landing','benefits','item_4','Continue cleanly into the full flow','text','Benefit 4',60),

-- AUTHORITY
('landing','authority','title','Built for people who need leads, not another theory','text','Section title',10),
('landing','authority','body','The quiz is designed for founders, creators, consultants, and experts who want to understand what is making their lead flow unpredictable.','text','Section body',20),

-- CTA (bottom)
('landing','cta','title','Find the gap in your lead flow','text','Section title',10),
('landing','cta','body','Start with the quiz, get your diagnosis, then move into the next step with clarity.','text','Section body',20),
('landing','cta','button','Start the quiz','text','Button label',30),

-- STICKY (bottom-fixed bar)
('landing','sticky','tagline','Ready to find the gap in your lead flow?','text','Sticky bar text',10),
('landing','sticky','button','Start the quiz','text','Sticky bar button label',20);
