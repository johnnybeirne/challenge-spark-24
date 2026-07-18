
CREATE TABLE public.nav_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  tip text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  in_tour boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nav_tips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_tips TO authenticated;
GRANT ALL ON public.nav_tips TO service_role;

ALTER TABLE public.nav_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nav tips" ON public.nav_tips FOR SELECT USING (true);
CREATE POLICY "Admins manage nav tips" ON public.nav_tips FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER nav_tips_updated_at BEFORE UPDATE ON public.nav_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.nav_tips (key, label, tip, sort_order, in_tour) VALUES
  ('focus_mode',   'Focus Mode',   'Hide the side menus to concentrate on today''s lesson without distractions.', 10, true),
  ('top_training', 'Training',     'Watch the pre-challenge videos and per-day training that go with each step.', 20, true),
  ('top_community','Community',    'Meet the other builders in the challenge and share what you''re working on.', 30, true),
  ('top_events',   'Events',       'See the live sessions, Q&As and calendar dates for the current cohort.', 40, true),
  ('top_ai_coach', 'AI Coach',     'Ask the AI coach anything — it knows your challenge context and your answers.', 50, true),
  ('top_leaderboard','Leaderboard','Track your rank and see who''s pulling ahead on invites and momentum.', 60, true),
  ('day_progress', 'Day Progress', 'Your 3-day path. Tap any unlocked day to jump straight to it.', 70, false),
  ('nav_invites',  'Invites',      'Grab your referral link and see who''s joined through you.', 80, false),
  ('nav_rewards',  'Rewards',      'Redeem the points you''ve earned for unlocks, gifts and upgrades.', 90, false),
  ('nav_resources','Resources',    'Downloads, templates and links that go with the challenge.', 100, false),
  ('nav_settings', 'Settings',     'Update your profile, avatar and notification preferences.', 110, false),
  ('nav_support',  'Support',      'Email us when something isn''t working — we reply fast.', 120, false),
  ('nav_logout',   'Logout',       'Sign out of your account on this device.', 130, false);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nav_tour_completed_at timestamptz;
