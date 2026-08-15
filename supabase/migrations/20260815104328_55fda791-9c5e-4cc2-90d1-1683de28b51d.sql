INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order, column_slot)
VALUES
  ('dashboard', 'assets', 'promise_badge', 'Day 1', 'text', 'Promise badge label', 6, 'full'),
  ('dashboard', 'assets', 'promise_title', 'Your Challenge Promise', 'text', 'Promise title', 7, 'full'),
  ('dashboard', 'assets', 'promise_copy', 'The one sentence that sums up the challenge you are building.', 'text', 'Promise intro copy', 8, 'full')
ON CONFLICT (page, section, key) DO UPDATE SET value = EXCLUDED.value, label = EXCLUDED.label, updated_at = now();