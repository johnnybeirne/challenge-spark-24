ALTER TABLE public.unlock_gates
  ADD COLUMN IF NOT EXISTS free_window_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS instant_heading text NOT NULL DEFAULT 'Unlock instantly',
  ADD COLUMN IF NOT EXISTS instant_body text NOT NULL DEFAULT 'Get access right now and carry on building.',
  ADD COLUMN IF NOT EXISTS instant_caption text NOT NULL DEFAULT 'Instant access, no waiting.',
  ADD COLUMN IF NOT EXISTS progress_template text NOT NULL DEFAULT '{joined} of {required} joined, {remaining} more to go',
  ADD COLUMN IF NOT EXISTS progress_complete_text text NOT NULL DEFAULT 'You have invited enough friends. Access is open.',
  ADD COLUMN IF NOT EXISTS dashboard_label text NOT NULL DEFAULT 'Go to your dashboard',
  ADD COLUMN IF NOT EXISTS dashboard_note text NOT NULL DEFAULT 'Everything you have created so far is saved in your dashboard.',
  ADD COLUMN IF NOT EXISTS preview_path text NOT NULL DEFAULT '';

ALTER TABLE public.challenge_progress
  ADD COLUMN IF NOT EXISTS day_completed_at jsonb NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO public.unlock_gates (key, label, enabled, title, body, teaser_lines, price_cents, price_id, invites_required, show_buy, show_invite, buy_label, invite_label, sort_order, free_window_hours, preview_path)
VALUES
  ('day2', 'Day 2', true, 'Day 2 is locked', 'Your free window for opening Day 2 has passed. You can open it by inviting friends who join, or by unlocking it now.', 3, 4700, 'leadio_premium_lifetime_usd', 3, true, true, 'Unlock now', 'Invite to unlock', 2, 24, '/challenge/day-2'),
  ('day3', 'Day 3', true, 'Day 3 is locked', 'Your free window for opening Day 3 has passed. You can open it by inviting friends who join, or by unlocking it now.', 3, 4700, 'leadio_premium_lifetime_usd', 3, true, true, 'Unlock now', 'Invite to unlock', 3, 24, '/challenge/day-3')
ON CONFLICT (key) DO NOTHING;

UPDATE public.unlock_gates SET preview_path = '/challenge/day-1' WHERE key = 'day1' AND preview_path = '';