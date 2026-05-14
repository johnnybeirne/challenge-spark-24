import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Save, RefreshCw, Send } from "lucide-react";

const TEMPLATE_ID = "waitlist_invite";

const DEFAULT_HTML = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ffffff;padding:32px 16px;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You're on the waitlist</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#334155;">{{greeting}}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;">Thanks for joining the waitlist for the 3-day challenge. Here's your personal invite link:</p>
    <p style="margin:0 0 24px;"><a href="{{url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">Open your invite link</a></p>
    <p style="font-size:13px;line-height:1.6;margin:0 0 8px;color:#475569;word-break:break-all;">Or share this URL directly:<br/><a href="{{url}}" style="color:#4f46e5;">{{url}}</a></p>
    <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#334155;"><strong>Invite 3 people to unlock priority access to bonus extras.</strong></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">— The Leadio team</p>
  </div>
</body></html>`;

const renderTemplate = (template: string, name: string) => {
  const greeting = name.trim() ? `Hi ${name.trim()},` : "Hi there,";
  const url = "https://leadio.johnnybeirne.com/waitlist?ref=PREVIEW123";
  return template
    .split("{{greeting}}").join(greeting)
    .split("{{url}}").join(url)
    .split("{{name}}").join(name.trim() || "there");
};

const AdminWaitlistEmail = () => {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewName, setPreviewName] = useState("Jane");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("subject,html_body")
      .eq("id", TEMPLATE_ID)
      .maybeSingle();
    if (error) {
      toast.error("Failed to load template");
    } else if (data) {
      setSubject(data.subject);
      setHtml(data.html_body);
    } else {
      setSubject("You're on the waitlist");
      setHtml(DEFAULT_HTML);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!subject.trim() || !html.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("email_templates")
      .upsert({
        id: TEMPLATE_ID,
        subject: subject.trim(),
        html_body: html,
        updated_at: new Date().toISOString(),
        updated_by: userRes.user?.id ?? null,
      });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Template saved");
    }
  };

  const sendTest = async () => {
    const to = testEmail.trim();
    if (!to.includes("@")) {
      toast.error("Enter a valid test email");
      return;
    }
    setSending(true);
    try {
      const renderedSubject = renderTemplate(subject, previewName);
      const rendered = renderTemplate(html, previewName);
      const { error } = await supabase.functions.invoke("send-email", {
        body: { to, subject: renderedSubject, html: rendered },
      });
      if (error) throw error;
      toast.success(`Test email sent to ${to}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const previewSubject = useMemo(() => renderTemplate(subject, previewName), [subject, previewName]);
  const preview = useMemo(() => renderTemplate(html, previewName), [html, previewName]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Waitlist email</h1>
          <p className="text-sm text-muted-foreground">
            Edit the invite email sent when someone joins the waitlist.
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Available placeholders</p>
        <ul className="mt-2 space-y-1">
          <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{greeting}}"}</code> — "Hi [Name]," or "Hi there,"</li>
          <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{name}}"}</code> — first name or "there"</li>
          <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{url}}"}</code> — personal referral link</li>
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              maxLength={200}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="html">HTML body</Label>
            <Textarea
              id="html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              disabled={loading}
              rows={20}
              className="mt-1.5 font-mono text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving || loading} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save template"}
            </Button>
            <Button onClick={load} variant="outline" disabled={loading} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Reload
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Preview</Label>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Preview first name"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="test@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={sendTest}
              variant="outline"
              disabled={sending || loading}
              className="mt-2 gap-2"
            >
              <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send test email"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs">
              <span className="font-semibold text-foreground">Subject:</span>{" "}
              <span className="text-muted-foreground">{previewSubject || "—"}</span>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview}
              sandbox=""
              className="h-[640px] w-full bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWaitlistEmail;
