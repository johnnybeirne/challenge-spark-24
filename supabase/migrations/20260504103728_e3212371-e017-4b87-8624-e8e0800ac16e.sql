-- Generic key/value site content store for the mega CMS dashboard
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'main',
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  value_type TEXT NOT NULL DEFAULT 'text', -- text | textarea | richtext | url | image
  label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page, section, key)
);

CREATE INDEX idx_site_content_page ON public.site_content(page);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site content"
  ON public.site_content FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site content"
  ON public.site_content FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site content"
  ON public.site_content FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed core editable copy across priority pages
INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order) VALUES
-- LANDING
('landing','hero','eyebrow','The 3-Day Builder Challenge','text','Eyebrow',1),
('landing','hero','headline','Build, ship, and grow in 3 days','text','Headline',2),
('landing','hero','subhead','A guided sprint to launch something real with AI as your co-pilot.','textarea','Subhead',3),
('landing','hero','cta_primary','Start the challenge','text','Primary CTA',4),
('landing','hero','cta_secondary','See how it works','text','Secondary CTA',5),
('landing','social','title','Builders already shipping','text','Section title',1),
('landing','faq','title','Questions','text','FAQ title',1),

-- SIGNUP / JOIN
('signup','hero','headline','Join the challenge','text','Headline',1),
('signup','hero','subhead','Create your account to start Day 1.','textarea','Subhead',2),
('signup','form','cta','Create account','text','Submit button',3),

-- RESULTS (static surrounding copy)
('results','header','title','Your diagnostic','text','Page title',1),
('results','header','subtitle','Here is what Johnny B AI sees in your answers.','textarea','Subtitle',2),
('results','cta','primary','Continue to your dashboard','text','Primary CTA',3),

-- DASHBOARD
('dashboard','header','title','Your challenge','text','Page title',1),
('dashboard','header','subtitle','Pick up where you left off.','textarea','Subtitle',2),
('dashboard','progress','label','Challenge progress','text','Progress label',3),

-- CHALLENGE DAYS
('challenge','day1','title','Day 1 — Pick & position','text','Day 1 title',1),
('challenge','day1','intro','Lock the audience, the offer, and the hook.','textarea','Day 1 intro',2),
('challenge','day2','title','Day 2 — Build the asset','text','Day 2 title',3),
('challenge','day2','intro','Use AI to draft, refine, and publish.','textarea','Day 2 intro',4),
('challenge','day3','title','Day 3 — Ship & share','text','Day 3 title',5),
('challenge','day3','intro','Launch your URL and bring 3 builders with you.','textarea','Day 3 intro',6),

-- UNLOCKS
('unlocks','header','title','Your unlocks','text','Title',1),
('unlocks','header','subtitle','Earn rewards as you progress.','textarea','Subtitle',2),
('unlocks','community','title','Builder Circle','text','Community unlock title',3),
('unlocks','community','description','Finish Day 3, share your URL, and invite 3 builders.','textarea','Community unlock description',4),

-- REWARDS
('rewards','header','title','Rewards','text','Title',1),
('rewards','header','subtitle','Claim what you have unlocked.','textarea','Subtitle',2),

-- REFERRALS
('referrals','header','title','Bring builders','text','Title',1),
('referrals','header','subtitle','Share your link. Climb the leaderboard. Unlock the Circle.','textarea','Subtitle',2),
('referrals','share','cta','Copy your link','text','Share CTA',3);