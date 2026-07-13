
CREATE TABLE public.premium_upsell_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heading text NOT NULL DEFAULT 'Want to go deeper on quiz funnel strategy?',
  body_text text NOT NULL DEFAULT 'The full course is $497. Invite three friends and it is yours free, or upgrade now and skip the invites.',
  price integer NOT NULL DEFAULT 497,
  invite_count integer NOT NULL DEFAULT 3,
  button_label text NOT NULL DEFAULT 'Invite 3 friends, unlock free',
  button_sublabel text NOT NULL DEFAULT 'Worth $497',
  upgrade_link_label text NOT NULL DEFAULT 'or upgrade now for $497',
  upgrade_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_upsell_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.premium_upsell_settings TO authenticated;
GRANT ALL ON public.premium_upsell_settings TO service_role;

ALTER TABLE public.premium_upsell_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view premium upsell settings"
  ON public.premium_upsell_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert premium upsell settings"
  ON public.premium_upsell_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update premium upsell settings"
  ON public.premium_upsell_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete premium upsell settings"
  ON public.premium_upsell_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_premium_upsell_settings_updated_at
  BEFORE UPDATE ON public.premium_upsell_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.premium_upsell_settings DEFAULT VALUES;
