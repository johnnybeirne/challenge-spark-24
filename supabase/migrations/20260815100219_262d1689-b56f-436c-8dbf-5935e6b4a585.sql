DELETE FROM public.site_content WHERE page='dashboard' AND section='assets' AND key IN ('empty','cta');

UPDATE public.site_content SET value='Everything you build in the challenge lands here, ready to use.' WHERE page='dashboard' AND section='assets' AND key='intro';

INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order) VALUES
('dashboard','assets','asset1_badge','Asset 1','text','First asset badge',3),
('dashboard','assets','asset1_title','Your Roadmap','text','First asset title',4),
('dashboard','assets','asset1_copy','Your roadmap is your first asset and it was created on Day 1. It holds the three pillars your challenge is built on.','text','First asset description',5),
('dashboard','assets','asset1_cta','View your roadmap','text','First asset link label',6),
('dashboard','assets','asset2_badge','Asset 2','text','Second asset badge',7),
('dashboard','assets','asset2_title','Your Quiz','text','Second asset title',8),
('dashboard','assets','asset2_pending_copy','Your quiz is the next asset that joins your roadmap. You build it on Day 2.','text','Second asset description before it is built',9),
('dashboard','assets','asset2_pending_cta','Build your quiz','text','Second asset link label',10),
('dashboard','assets','asset2_ready_copy','Your quiz is built and ready to download.','text','Second asset description after it is built',11)
ON CONFLICT DO NOTHING;