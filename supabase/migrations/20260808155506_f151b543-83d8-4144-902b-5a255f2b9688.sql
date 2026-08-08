INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order)
VALUES
 ('day2','header','title','Build your quiz','text','Page title',1),
 ('day2','header','subtitle','Your quiz starts the conversation. Your challenge builds the trust that converts.','text','Subtitle',2)
ON CONFLICT DO NOTHING;