
CREATE TABLE public.milestone_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone text NOT NULL UNIQUE
    CHECK (milestone IN ('day1_complete','quiz_assets_ready','challenge_complete')),
  subject text NOT NULL,
  html_body text NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.milestone_email_templates TO authenticated;
GRANT ALL ON public.milestone_email_templates TO service_role;

ALTER TABLE public.milestone_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view milestone email templates"
  ON public.milestone_email_templates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update milestone email templates"
  ON public.milestone_email_templates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_milestone_email_templates_updated_at
  BEFORE UPDATE ON public.milestone_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the three templates with the current hardcoded copy, converted to tokens.
INSERT INTO public.milestone_email_templates (milestone, subject, html_body) VALUES
(
  'day1_complete',
  'Day 1 is done. Your challenge has a promise now.',
  $HTML$<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Nice work, {{name}}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Day 1 is complete, and your challenge now has a clear promise behind it.</p>
    <blockquote style="margin:20px 0;padding:16px 20px;border-left:4px solid #4f46e5;background:#f5f3ff;border-radius:6px;font-size:16px;line-height:1.6;color:#1e1b4b;font-style:italic;">{{promise}}</blockquote>
    <p style="font-size:15px;line-height:1.7;margin:16px 0 0;color:#334155;">In Day 2, we build the asset that turns curious visitors into leads: your quiz. It is where your promise starts doing real work for you.</p>
    <p style="margin:24px 0;"><a href="{{day2_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:15px;">Continue to Day 2</a></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>$HTML$
),
(
  'quiz_assets_ready',
  'Your quiz is ready. Your downloads are waiting.',
  $HTML$<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Your quiz is built, {{name}}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Your lead generation quiz has been generated, and both the Word doc and Google Doc versions are ready to grab in Your Assets on your dashboard.</p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Open it up, take a look, and download the versions you want to keep.</p>
    <p style="margin:24px 0;"><a href="{{dashboard_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:15px;">Open Your Assets</a></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>$HTML$
),
(
  'challenge_complete',
  'You built it. Here is everything you created.',
  $HTML$<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You finished the challenge, {{name}}.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">That is a serious piece of work. Here is what you now have to show for it:</p>
    <ul style="font-size:15px;line-height:1.8;margin:0 0 16px 20px;padding:0;color:#334155;">
      <li>A clear challenge promise</li>
      <li>A lead generation quiz built around that promise</li>
      <li>Downloadable Word and Google Doc versions of your assets</li>
    </ul>
    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;color:#334155;">Everything stays available in your dashboard, ready whenever you want to use it, refine it, or share it.</p>
    <p style="margin:24px 0;"><a href="{{dashboard_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;font-size:15px;">Open your dashboard</a></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">Johnny Beirne</p>
  </div>
</body></html>$HTML$
);
