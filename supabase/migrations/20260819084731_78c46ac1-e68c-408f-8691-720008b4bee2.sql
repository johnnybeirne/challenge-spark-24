CREATE TABLE public.admin_page_tags (
  page_key text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  tags text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_page_tags TO anon, authenticated;
GRANT ALL ON public.admin_page_tags TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.admin_page_tags TO authenticated;

ALTER TABLE public.admin_page_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read admin page tags"
  ON public.admin_page_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert admin page tags"
  ON public.admin_page_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin page tags"
  ON public.admin_page_tags FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin page tags"
  ON public.admin_page_tags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_page_tags_updated_at
  BEFORE UPDATE ON public.admin_page_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.admin_page_tags (page_key, label, tags) VALUES
  ('/owner-console/view-as-user', 'View as user', 'impersonate, preview, participant, see what users see, test account'),
  ('/quiz-preview', 'User quiz preview', 'quiz, preview, diagnostic, assessment, sample quiz'),
  ('/owner-console/quiz-preview-tips', 'Quiz preview tips', 'quiz tips, tooltip, help text, hints, quiz preview'),
  ('/owner-console/overview', 'Product overview', 'overview, documentation, summary, what the product does'),
  ('/owner-console/bios', 'Registrants', 'users, participants, signups, bios, members, referral link, email list'),
  ('/owner-console/jv-partners', 'JV partners', 'partners, affiliates, joint venture, applications'),
  ('/owner-console', 'Console home', 'home, dashboard, admin, start here'),
  ('/owner-console/content', 'Quiz LP Editor', 'landing page, copy, headline, quiz page, content, words on the page'),
  ('/owner-console/powered-by-editor', 'Powered By Page', 'powered by, branding, footer, credits'),
  ('/owner-console/resources', 'Resource library', 'downloads, files, library, resources, handouts'),
  ('/owner-console/analytics', 'Analytics', 'stats, numbers, metrics, events, tracking, reports'),
  ('/owner-console/waitlist-email', 'Waitlist email', 'email, waitlist, template, welcome email'),
  ('/owner-console/newsletter', 'Newsletter', 'email, broadcast, newsletter, send to list, campaign'),
  ('/owner-console/milestone-emails', 'Milestone emails', 'email, day 1 email, day 2 email, day 3 email, completed, automatic email'),
  ('/owner-console/promoters', 'Promoters', 'referrers, leaderboard, top inviters, promoters'),
  ('/owner-console/activity', 'Activity feed', 'feed, events, log, activity, social proof'),
  ('/owner-console/training', 'Training system', 'training, lessons, course, modules, videos'),
  ('/owner-console/day1-steps', 'Day 1 step editor', 'day 1, questions, steps, setup, chat, prompts'),
  ('/owner-console/day2-buttons', 'Day 2 button labels', 'day 2, buttons, labels, call to action, wording'),
  ('/owner-console/unlocks', 'Locked day messages', 'day 2 locked message, day 3 locked message, locked day, unlock gate, invite to unlock, buy to unlock, gate copy, window'),
  ('/owner-console/lead-gen-quiz', 'Lead gen quiz', 'quiz, questions, diagnostic, scoring, lead gen'),
  ('/owner-console/diagnostic-responses', 'Lead gen quiz responses', 'responses, answers, results, submissions, scores'),
  ('/owner-console/results-advisor-prompts', 'Results advisor prompts', 'results, advisor, ai, prompts, suggestions'),
  ('/owner-console/typography', 'Typography', 'font, size, heading, text size, styling'),
  ('/owner-console/coupons', 'Coupons', 'discount, promo code, voucher, coupon, offer'),
  ('/owner-console/premium-upsell', 'Premium upsell', 'upsell, invite, upgrade, day 2, offer'),
  ('/owner-console/rewards-ladder', 'Rewards ladder', 'rewards ladder, prizes, buy reward, points reward, unlock reward, rung, price'),
  ('/owner-console/nav-tips', 'Hover Tips', 'hover, tooltip, nav tips, hints, sidebar tips'),
  ('/owner-console/user-tour', 'User Tour Walkthrough', 'user tour, walkthrough, guided tour, onboarding, first visit, popover'),
  ('/owner-console/access-pages', 'Access pages', 'training page, community page, events page, tagline, headings, access'),
  ('/owner-console/mentor-prompts', 'LeadTree AI prompts', 'mentor, coach, starter questions, prompts, suggested'),
  ('/owner-console/ai-coach-settings', 'LeadTree AI settings', 'system prompt, mentor, assistant, tokens, heading, fallback'),
  ('/feature-extractor', 'Feature extractor', 'features, extract, audit, list features'),
  ('/requirements-checklist', 'Requirements checklist', 'checklist, requirements, launch, readiness'),
  ('/admin/qa-run', 'QA challenge runner', 'qa, test, end to end, runner, demo, smoke test'),
  ('/owner-console/guest-passes', 'Private guest passes', 'guest, private link, look around, pass, access link, invite someone'),
  ('/admin/simulator', 'Challenge simulator', 'simulator, walkthrough, presentation, demo, screens, play'),
  ('/owner-console/menu-tags', 'Menu Search Tags', 'find pages, search, tags, keywords, menu, navigation'),
  ('/', 'Landing page', 'home, landing, public site, front page'),
  ('/waitlist/thanks?preview=1', 'Waitlist thanks (preview)', 'waitlist, thanks, confirmation, thank you page'),
  ('/owner-console/premium-page', 'Course Sales Page', 'premium page, course, sales page, enrol, pricing'),
  ('/owner-console/builder-prompts', 'Builder Prompts', 'prompts, builder, ai, day prompts'),
  ('/owner-console/referral-settings', 'Referral settings', 'points, badges, featured creator, invites, threshold, access, membership');