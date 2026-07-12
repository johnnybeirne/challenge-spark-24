
CREATE TABLE public.typography_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  h1_size integer NOT NULL DEFAULT 28,
  h2_size integer NOT NULL DEFAULT 20,
  h3_size integer NOT NULL DEFAULT 15,
  body_size integer NOT NULL DEFAULT 14,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.typography_settings TO anon, authenticated;
GRANT UPDATE ON public.typography_settings TO authenticated;
GRANT ALL ON public.typography_settings TO service_role;

ALTER TABLE public.typography_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read typography settings"
  ON public.typography_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update typography settings"
  ON public.typography_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert typography settings"
  ON public.typography_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_typography_settings_updated_at
  BEFORE UPDATE ON public.typography_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.typography_settings (h1_size, h2_size, h3_size, body_size)
VALUES (28, 20, 15, 14);
