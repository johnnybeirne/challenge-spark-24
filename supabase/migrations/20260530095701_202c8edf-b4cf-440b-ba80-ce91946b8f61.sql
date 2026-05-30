
-- Public bucket for site images managed via the content editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access
CREATE POLICY "Public read site-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

-- Admins manage files
CREATE POLICY "Admins upload site-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update site-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete site-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
