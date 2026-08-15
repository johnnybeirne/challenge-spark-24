INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order)
SELECT v.page, v.section, v.key, v.value, v.value_type, v.label, v.sort_order
FROM (VALUES
 ('dashboard','assets','heading','Your Assets','text','Assets heading',1),
 ('dashboard','assets','intro','Everything you build in the challenge lands here, ready to download.','textarea','Assets intro',2),
 ('dashboard','assets','empty','Your first asset appears after you build your quiz on Day 2.','textarea','Assets empty state',3),
 ('dashboard','assets','cta','Build your quiz','text','Assets empty state button',4),
 ('dashboard','roadmap','heading','Your Roadmap','text','Roadmap heading',1),
 ('dashboard','roadmap','intro','Here is what you build across the three days, in sequence.','textarea','Roadmap intro',2),
 ('dashboard','roadmap','day1_label','Day 1','text','Day 1 label',3),
 ('dashboard','roadmap','day1_title','Set your foundation','text','Day 1 title',4),
 ('dashboard','roadmap','day1_copy','Name your audience, their problem and your superpower, then shape your challenge title.','textarea','Day 1 copy',5),
 ('dashboard','roadmap','day2_label','Day 2','text','Day 2 label',6),
 ('dashboard','roadmap','day2_title','Build your quiz','text','Day 2 title',7),
 ('dashboard','roadmap','day2_copy','Turn your foundation into a working quiz and download it as a Word doc or Google Doc.','textarea','Day 2 copy',8),
 ('dashboard','roadmap','day3_label','Day 3','text','Day 3 label',9),
 ('dashboard','roadmap','day3_title','Launch and share','text','Day 3 title',10),
 ('dashboard','roadmap','day3_copy','Put your quiz live, share your link and start collecting leads.','textarea','Day 3 copy',11)
) AS v(page, section, key, value, value_type, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content sc
  WHERE sc.page = v.page AND sc.section = v.section AND sc.key = v.key
);