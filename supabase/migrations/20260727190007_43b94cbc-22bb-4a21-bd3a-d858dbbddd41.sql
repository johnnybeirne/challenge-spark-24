INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order, column_slot)
VALUES
  ('about-me', 'bio', 'paragraph_1', 'Johnny Beirne is the founder of the Digital Business Institute and a fractional AI advisor. His focus is the practical, everyday use of AI.', 'text', 'Paragraph 1', 1, 'full'),
  ('about-me', 'bio', 'paragraph_2', 'Working alongside clients across three continents, he turns their hard-won expertise into AI-powered tools that work the way they do. The knowledge is theirs; the results are theirs. Clients move from idea to finished tool, freeing them to do more of what they do best; and to be more productive and profitable.', 'text', 'Paragraph 2', 2, 'full'),
  ('about-me', 'bio', 'paragraph_3', 'Johnny is also the co-author of the best-selling Rethink Remoting, a speaker, and an educator who makes powerful technology feel within reach.', 'text', 'Paragraph 3', 3, 'full')
ON CONFLICT (page, section, key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  column_slot = EXCLUDED.column_slot;
