CREATE TABLE public.featured_creator_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threshold integer NOT NULL DEFAULT 100,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.featured_creator_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_creator_settings TO authenticated;
GRANT ALL ON public.featured_creator_settings TO service_role;

ALTER TABLE public.featured_creator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured creator settings are viewable by everyone"
  ON public.featured_creator_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert featured creator settings"
  ON public.featured_creator_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update featured creator settings"
  ON public.featured_creator_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete featured creator settings"
  ON public.featured_creator_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_featured_creator_settings_updated_at
  BEFORE UPDATE ON public.featured_creator_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.featured_creator_settings (threshold) VALUES (100);

CREATE TABLE public.invite_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  threshold integer NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.invite_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_badges TO authenticated;
GRANT ALL ON public.invite_badges TO service_role;

ALTER TABLE public.invite_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invite badges are viewable by everyone"
  ON public.invite_badges FOR SELECT USING (true);
CREATE POLICY "Admins can insert invite badges"
  ON public.invite_badges FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update invite badges"
  ON public.invite_badges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete invite badges"
  ON public.invite_badges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_invite_badges_updated_at
  BEFORE UPDATE ON public.invite_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.invite_badges (name, threshold, description, sort_order) VALUES
  ('Spark', 1, 'You started the tree growing.', 1),
  ('Grower', 3, 'Three people joined because of you.', 2),
  ('Branch', 5, 'You hit your first monthly target.', 3),
  ('Connector', 10, 'Ten people in your network are now building.', 4),
  ('Cultivator', 20, 'Twenty signups. Your tree is growing fast.', 5);