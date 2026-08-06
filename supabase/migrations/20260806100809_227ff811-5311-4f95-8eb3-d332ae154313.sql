CREATE TABLE public.access_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  header_text text NOT NULL DEFAULT '',
  intro_text text NOT NULL DEFAULT '',
  referral_heading text NOT NULL DEFAULT '',
  referral_copy text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.access_pages TO anon;
GRANT SELECT ON public.access_pages TO authenticated;
GRANT ALL ON public.access_pages TO service_role;

ALTER TABLE public.access_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access pages are readable by everyone"
  ON public.access_pages FOR SELECT USING (true);

CREATE POLICY "Admins can insert access pages"
  ON public.access_pages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update access pages"
  ON public.access_pages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete access pages"
  ON public.access_pages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_access_pages_updated_at
  BEFORE UPDATE ON public.access_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.access_pages (page_key, header_text, intro_text, referral_heading, referral_copy, items) VALUES
('training',
 'Welcome to Training, {{first_name}}',
 'Everything here is built to help you sharpen your challenge and keep momentum. Work through it at your own pace — and bring the people who should be building alongside you.',
 'Your personal invite link',
 'Every friend who joins through this link moves you up the leaderboard and unlocks more of the training.',
 '[{"icon":"GraduationCap","heading":"Learn in short bursts","copy":"Each session is designed to be finished in a single sitting, so progress never stalls."},{"icon":"Sparkles","heading":"Apply as you go","copy":"Bring your own challenge into every exercise instead of taking notes for later."}]'::jsonb),
('community',
 'Welcome to Community, {{first_name}}',
 'This is where builders compare notes, share what worked, and pull each other forward. The more people you bring in, the more useful it gets.',
 'Your personal invite link',
 'Share this and every person who joins is credited to you — and lands right beside you in the community.',
 '[{"icon":"Users","heading":"Build in good company","copy":"You will see what other builders are shipping and how they are getting traction."},{"icon":"Heart","heading":"Give before you ask","copy":"The builders who support others are the ones the community rallies behind."}]'::jsonb),
('events',
 'Welcome to Events, {{first_name}}',
 'Live sessions, Q&As, and working blocks run alongside the challenge. Turn up, ask questions, and leave with something built.',
 'Your personal invite link',
 'Invite someone to the next live session — every person who joins through your link counts toward your rewards.',
 '[{"icon":"CalendarDays","heading":"Sessions that fit around you","copy":"Everything is short, focused, and scheduled around the three challenge days."},{"icon":"Video","heading":"Replays if you miss one","copy":"Cannot make it live? Every session is available afterwards so you never fall behind."}]'::jsonb);