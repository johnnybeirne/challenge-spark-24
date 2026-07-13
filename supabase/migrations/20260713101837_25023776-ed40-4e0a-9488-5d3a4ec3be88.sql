CREATE TABLE public.premium_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_eyebrow text NOT NULL DEFAULT 'LeadTree Growth Accelerator',
  hero_headline text NOT NULL DEFAULT 'Turn your expertise into a challenge-based growth engine.',
  hero_subheadline text NOT NULL DEFAULT 'The full LeadTree system — assessment-first funnels, AI-guided challenges, referral loops, and trust-based lead generation. Built to compound.',
  hero_cta_label text NOT NULL DEFAULT 'Enrol Here',
  hero_cta_url text NOT NULL DEFAULT '',
  hero_supporting_line text NOT NULL DEFAULT 'Lifetime access. One-time payment. 14-day refund.',
  hero_stat_1 text NOT NULL DEFAULT '200+ Challenges',
  hero_stat_2 text NOT NULL DEFAULT '12k+ Builders',
  hero_stat_3 text NOT NULL DEFAULT '4.9/5 Rating',
  preview_title text NOT NULL DEFAULT 'LeadTree Growth Accelerator',
  preview_badge text NOT NULL DEFAULT 'Premium',
  preview_bullets text[] NOT NULL DEFAULT ARRAY[
    'Assessment-first funnel design',
    '3-day challenge architecture',
    'AI-guided participant experience',
    'Referral and partner loops',
    'Trust-based lead conversion'
  ],
  price integer NOT NULL DEFAULT 497,
  coupon_enabled boolean NOT NULL DEFAULT true,
  problem_eyebrow text NOT NULL DEFAULT 'The Problem',
  problem_headline text NOT NULL DEFAULT 'Most lead generation systems fail because trust is missing.',
  problem_cards jsonb NOT NULL DEFAULT '[
    {"title": "Cold outreach burns bridges", "description": "Prospects ignore generic pitches and unsubscribe fast."},
    {"title": "Courses sit unfinished", "description": "Information without implementation rarely creates change."},
    {"title": "Referrals feel awkward", "description": "Without a structured reason to share, people stay silent."},
    {"title": "Leads do not convert", "description": "Trust is earned through experience, not promises."},
    {"title": "Growth stalls after launch", "description": "Without compounding systems, momentum fades quickly."}
  ]'::jsonb,
  build_eyebrow text NOT NULL DEFAULT 'What You''ll Build',
  build_headline text NOT NULL DEFAULT 'A complete growth engine, not another course.',
  build_subheadline text NOT NULL DEFAULT 'Four interlocking systems that compound on each other.',
  build_cards jsonb NOT NULL DEFAULT '[
    {"title": "Assessment Funnel", "description": "A diagnostic entry point that qualifies and pre-sells the right people."},
    {"title": "Challenge Experience", "description": "A time-bound, guided journey that turns strangers into engaged participants."},
    {"title": "Referral Engine", "description": "Built-in invite loops that reward sharing and multiply reach."},
    {"title": "Partner System", "description": "A promoter and JV layer that scales distribution without extra ad spend."}
  ]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_page_settings TO anon;
GRANT SELECT ON public.premium_page_settings TO authenticated;
GRANT ALL ON public.premium_page_settings TO service_role;

ALTER TABLE public.premium_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read premium page settings"
  ON public.premium_page_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage premium page settings"
  ON public.premium_page_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_premium_page_settings_updated_at
  BEFORE UPDATE ON public.premium_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.premium_page_settings (
  hero_eyebrow,
  hero_headline,
  hero_subheadline,
  hero_cta_label,
  hero_cta_url,
  hero_supporting_line,
  hero_stat_1,
  hero_stat_2,
  hero_stat_3,
  preview_title,
  preview_badge,
  preview_bullets,
  price,
  coupon_enabled,
  problem_eyebrow,
  problem_headline,
  problem_cards,
  build_eyebrow,
  build_headline,
  build_subheadline,
  build_cards
)
SELECT
  'LeadTree Growth Accelerator',
  'Turn your expertise into a challenge-based growth engine.',
  'The full LeadTree system — assessment-first funnels, AI-guided challenges, referral loops, and trust-based lead generation. Built to compound.',
  'Enrol Here',
  '',
  'Lifetime access. One-time payment. 14-day refund.',
  '200+ Challenges',
  '12k+ Builders',
  '4.9/5 Rating',
  'LeadTree Growth Accelerator',
  'Premium',
  ARRAY[
    'Assessment-first funnel design',
    '3-day challenge architecture',
    'AI-guided participant experience',
    'Referral and partner loops',
    'Trust-based lead conversion'
  ],
  497,
  true,
  'The Problem',
  'Most lead generation systems fail because trust is missing.',
  '[{"title":"Cold outreach burns bridges","description":"Prospects ignore generic pitches and unsubscribe fast."},{"title":"Courses sit unfinished","description":"Information without implementation rarely creates change."},{"title":"Referrals feel awkward","description":"Without a structured reason to share, people stay silent."},{"title":"Leads do not convert","description":"Trust is earned through experience, not promises."},{"title":"Growth stalls after launch","description":"Without compounding systems, momentum fades quickly."}]'::jsonb,
  'What You''ll Build',
  'A complete growth engine, not another course.',
  'Four interlocking systems that compound on each other.',
  '[{"title":"Assessment Funnel","description":"A diagnostic entry point that qualifies and pre-sells the right people."},{"title":"Challenge Experience","description":"A time-bound, guided journey that turns strangers into engaged participants."},{"title":"Referral Engine","description":"Built-in invite loops that reward sharing and multiply reach."},{"title":"Partner System","description":"A promoter and JV layer that scales distribution without extra ad spend."}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.premium_page_settings);