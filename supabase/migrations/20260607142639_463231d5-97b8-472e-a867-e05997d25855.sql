-- Submissions table
CREATE TABLE public.jv_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  list_size text NOT NULL,
  product_name text NOT NULL,
  product_url text,
  retail_value_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.jv_applications TO authenticated;
GRANT ALL ON public.jv_applications TO service_role;

ALTER TABLE public.jv_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view jv applications"
  ON public.jv_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update jv applications"
  ON public.jv_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete jv applications"
  ON public.jv_applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserts go through the edge function using the service role; no insert policy for authenticated.

CREATE TRIGGER update_jv_applications_updated_at
  BEFORE UPDATE ON public.jv_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed CMS rows for page `jv-apply`
INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order) VALUES
  ('jv-apply', 'intro', 'video_label',       'Video coming soon',                                                                                  'text',     'Video placeholder label',  10),
  ('jv-apply', 'intro', 'line_one',          'The bigger your bonus, the more incentivised your audience will be to promote.',                     'text',     'Intro line 1 (under video)', 20),
  ('jv-apply', 'intro', 'line_two',          'Don''t worry about list size. Every person you send in invites new people. The network grows itself.', 'text',   'Intro line 2 (under video)', 30),
  ('jv-apply', 'form', 'label_full_name',     'Full name',                                                                                          'text',     'Label: Full name',          10),
  ('jv-apply', 'form', 'label_email',         'Email address',                                                                                      'text',     'Label: Email address',      20),
  ('jv-apply', 'form', 'label_list_size',     'Approximate list size',                                                                              'text',     'Label: List size',          30),
  ('jv-apply', 'form', 'label_product_name',  'Paid product name',                                                                                  'text',     'Label: Paid product name',  40),
  ('jv-apply', 'form', 'label_product_url',   'Product URL',                                                                                        'text',     'Label: Product URL',        50),
  ('jv-apply', 'form', 'placeholder_product_url', 'e.g. https://yourproduct.com',                                                                   'text',     'Placeholder: Product URL',  55),
  ('jv-apply', 'form', 'label_retail_value',  'Retail value of your product',                                                                       'text',     'Label: Retail value',       60),
  ('jv-apply', 'form', 'submit_label',        'Apply to become a JV partner',                                                                       'text',     'Submit button label',       70),
  ('jv-apply', 'form', 'success_message',     'Application received. We''ll be in touch shortly.',                                                  'text',     'Success message',           80),
  ('jv-apply', 'email', 'admin_notify_to',    'johnny@johnnybeirne.com',                                                                            'text',     'Admin notification email',  10),
  ('jv-apply', 'email', 'confirm_subject',    'We received your JV partner application',                                                            'text',     'Confirmation email subject',20),
  ('jv-apply', 'email', 'confirm_body',       'Hi {{name}},\n\nThanks for applying to become a Leadio JV partner. We''ve received your application for "{{product_name}}" and will be in touch shortly.\n\n— Johnny', 'textarea', 'Confirmation email body (use {{name}} and {{product_name}})', 30)
ON CONFLICT (page, section, key) DO NOTHING;