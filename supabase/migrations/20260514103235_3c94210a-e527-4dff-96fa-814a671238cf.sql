
CREATE TABLE IF NOT EXISTS public.email_templates (
  id text PRIMARY KEY,
  subject text NOT NULL,
  html_body text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read email templates"
  ON public.email_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert email templates"
  ON public.email_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email templates"
  ON public.email_templates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_templates (id, subject, html_body)
VALUES (
  'waitlist_invite',
  'You''re on the waitlist',
  '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Arial,sans-serif;background:#ffffff;padding:32px 16px;color:#0f172a;"><div style="max-width:520px;margin:0 auto;"><h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You''re on the waitlist</h1><p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#334155;">{{greeting}}</p><p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;">Thanks for joining the waitlist for the 3-day challenge. Here''s your personal invite link:</p><p style="margin:0 0 24px;"><a href="{{url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">Open your invite link</a></p><p style="font-size:13px;line-height:1.6;margin:0 0 8px;color:#475569;word-break:break-all;">Or share this URL directly:<br/><a href="{{url}}" style="color:#4f46e5;">{{url}}</a></p><p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#334155;"><strong>Invite 3 people to unlock priority access to bonus extras.</strong></p><p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">— The Leadio team</p></div></body></html>'
)
ON CONFLICT (id) DO NOTHING;
