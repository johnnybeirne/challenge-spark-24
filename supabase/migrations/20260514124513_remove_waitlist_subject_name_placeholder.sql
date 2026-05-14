UPDATE public.email_templates
SET
  subject = 'You''re on the waitlist',
  updated_at = now()
WHERE id = 'waitlist_invite'
  AND subject LIKE '%{{name}}%';
