INSERT INTO public.site_content (page, section, key, label, value, value_type, sort_order, column_slot)
VALUES
 ('landing','about','eyebrow','Eyebrow','Who is behind the quiz','text',10,'full'),
 ('landing','about','title','Section title','About Johnny Beirne','text',20,'full'),
 ('landing','about','paragraph_1','Paragraph 1','Johnny Beirne is the founder of the Digital Business Institute and a fractional AI advisor. His focus is the practical, everyday use of AI.','text',30,'full'),
 ('landing','about','paragraph_2','Paragraph 2','Working alongside clients across three continents, he turns their hard-won expertise into AI-powered tools that work the way they do.','text',40,'full'),
 ('landing','about','paragraph_3','Paragraph 3','','text',50,'full'),
 ('landing','about','image','Photo','','image',60,'full'),
 ('landing','about','image_alt','Photo description','Johnny Beirne','text',70,'full')
ON CONFLICT DO NOTHING;