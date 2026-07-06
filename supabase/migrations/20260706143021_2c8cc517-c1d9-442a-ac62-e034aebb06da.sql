UPDATE public.milestone_email_templates
SET html_body = regexp_replace(
  html_body,
  '<p style="margin:24px 0;"><a href="\{\{day2_url\}\}"[^>]*>Continue to Day 2</a></p>',
  '<p style="margin:24px 0;font-size:15px;line-height:1.7;color:#334155;"><a href="{{day2_url}}" style="color:#1d4ed8;text-decoration:underline;font-weight:600;">Continue to Day 2</a></p>',
  'g'
),
updated_at = now()
WHERE milestone = 'day1_complete';

UPDATE public.milestone_email_templates
SET html_body = regexp_replace(
  html_body,
  '<p style="margin:24px 0;"><a href="\{\{dashboard_url\}\}"[^>]*>Open Your Assets</a></p>',
  '<p style="margin:24px 0;font-size:15px;line-height:1.7;color:#334155;"><a href="{{dashboard_url}}" style="color:#1d4ed8;text-decoration:underline;font-weight:600;">Open Your Assets</a></p>',
  'g'
),
updated_at = now()
WHERE milestone = 'quiz_assets_ready';

UPDATE public.milestone_email_templates
SET html_body = regexp_replace(
  html_body,
  '<p style="margin:24px 0;"><a href="\{\{dashboard_url\}\}"[^>]*>Open your dashboard</a></p>',
  '<p style="margin:24px 0;font-size:15px;line-height:1.7;color:#334155;"><a href="{{dashboard_url}}" style="color:#1d4ed8;text-decoration:underline;font-weight:600;">Open your dashboard</a></p>',
  'g'
),
updated_at = now()
WHERE milestone = 'challenge_complete';