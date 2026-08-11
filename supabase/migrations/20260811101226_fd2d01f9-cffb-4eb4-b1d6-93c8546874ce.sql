CREATE TABLE public.nav_info_popovers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL UNIQUE,
  label text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nav_info_popovers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_info_popovers TO authenticated;
GRANT ALL ON public.nav_info_popovers TO service_role;

ALTER TABLE public.nav_info_popovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nav info popovers"
  ON public.nav_info_popovers FOR SELECT USING (true);

CREATE POLICY "Admins manage nav info popovers"
  ON public.nav_info_popovers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_nav_info_popovers_updated_at
  BEFORE UPDATE ON public.nav_info_popovers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.nav_info_popovers (section, label, title, body, sort_order) VALUES
  ('training', 'Training', 'What is Training?', 'Training is your library of short lessons that walk you through building and running your 3-day challenge, step by step. Work through a lesson whenever you need the next piece, then apply it straight away in your challenge days.', 1),
  ('community', 'Community', 'What is Community?', 'Community is where challenge builders share progress, swap feedback on quizzes and offers, and get unstuck fast. Post what you are working on and other builders will respond with practical input.', 2),
  ('events', 'Events', 'What are Events?', 'Events are the live sessions on the calendar, including build workshops and question and answer calls with the trainer. Join live to get your work reviewed, or catch the replay in your own time.', 3);