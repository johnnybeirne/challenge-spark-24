CREATE TABLE public.access_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  points_threshold integer NOT NULL DEFAULT 500,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.access_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.access_settings TO authenticated;
GRANT ALL ON public.access_settings TO service_role;

ALTER TABLE public.access_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read access settings"
  ON public.access_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can update access settings"
  ON public.access_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert access settings"
  ON public.access_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.access_settings_single_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.access_settings LIMIT 1) THEN
    RAISE EXCEPTION 'Only one row is allowed in access_settings';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_access_settings_single_row
  BEFORE INSERT ON public.access_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.access_settings_single_row();

CREATE TRIGGER trg_access_settings_updated_at
  BEFORE UPDATE ON public.access_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.access_settings (points_threshold)
VALUES (500);