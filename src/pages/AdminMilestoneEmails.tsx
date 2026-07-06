import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Save, RefreshCw, Send } from "lucide-react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];
const SizeStyle: any = (Quill as any).import("attributors/style/size");
SizeStyle.whitelist = FONT_SIZES;
(Quill as any).register(SizeStyle, true);

type Milestone = "day1_complete" | "quiz_assets_ready" | "challenge_complete";

const MILESTONES: { id: Milestone; label: string; supportsPromise: boolean }[] = [
  { id: "day1_complete", label: "Day 1 Complete", supportsPromise: true },
  { id: "quiz_assets_ready", label: "Quiz Assets Ready", supportsPromise: false },
  { id: "challenge_complete", label: "Challenge Complete", supportsPromise: false },
];

type TemplateRow = { subject: string; html_body: string };

const AdminMilestoneEmails = () => {
  const [active, setActive] = useState<Milestone>("day1_complete");
  const [rows, setRows] = useState<Record<Milestone, TemplateRow>>({
    day1_complete: { subject: "", html_body: "" },
    quiz_assets_ready: { subject: "", html_body: "" },
    challenge_complete: { subject: "", html_body: "" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("johnny@johnnybeirne.com");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("milestone_email_templates")
      .select("milestone,subject,html_body");
    if (error) {
      toast.error("Failed to load templates");
      setLoading(false);
      return;
    }
    const next = { ...rows };
    for (const r of (data ?? []) as { milestone: Milestone; subject: string; html_body: string }[]) {
      next[r.milestone] = { subject: r.subject, html_body: r.html_body };
    }
    setRows(next);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const current = rows[active];
  const meta = useMemo(() => MILESTONES.find((m) => m.id === active)!, [active]);

  const updateField = (field: keyof TemplateRow, value: string) => {
    setRows((prev) => ({ ...prev, [active]: { ...prev[active], [field]: value } }));
  };

  const save = async () => {
    if (!current.subject.trim() || !current.html_body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("milestone_email_templates")
      .update({
        subject: current.subject.trim(),
        html_body: current.html_body,
        updated_by: userRes.user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("milestone", active);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${meta.label} template saved`);
  };

  const sendTest = async () => {
    const to = testEmail.trim();
    if (!to.includes("@")) { toast.error("Enter a valid test email"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("milestone-emails", {
        body: { milestone: active, test: true, testEmail: to },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error ?? error?.message ?? "Test failed");
      } else {
        toast.success(`Test sent to ${to}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Milestone emails</h1>
          <p className="text-sm text-muted-foreground">
            Edit the automated emails sent as challengers hit key milestones.
          </p>
        </div>
      </header>

      <Tabs value={active} onValueChange={(v) => setActive(v as Milestone)}>
        <TabsList>
          {MILESTONES.map((m) => (
            <TabsTrigger key={m.id} value={m.id}>{m.label}</TabsTrigger>
          ))}
        </TabsList>

        {MILESTONES.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-4 space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Available tokens</p>
              <ul className="mt-2 space-y-1">
                <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{name}}"}</code> — recipient's first name</li>
                {m.supportsPromise && (
                  <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{promise}}"}</code> — the user's Challenge Promise (Day 1 Complete only)</li>
                )}
                <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{day2_url}}"}</code> — link to Day 2 of the challenge</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{dashboard_url}}"}</code> — link to the challenger dashboard</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">{"{{app_url}}"}</code> — the app's base URL</li>
              </ul>
            </div>

            <div>
              <Label htmlFor={`subject-${m.id}`}>Subject</Label>
              <Input
                id={`subject-${m.id}`}
                value={current.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                disabled={loading}
                maxLength={300}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Email body</Label>
              <div className="mt-1.5 rounded-md border border-input bg-background">
                <ReactQuill
                  theme="snow"
                  value={current.html_body}
                  onChange={(v) => updateField("html_body", v)}
                  readOnly={loading}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      [{ size: FONT_SIZES }],
                      ["bold", "italic", "underline", "strike"],
                      [{ color: [] }, { background: [] }],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ align: [] }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                  className="bg-white [&_.ql-editor]:min-h-[420px] [&_.ql-editor]:text-black [&_.ql-editor]:bg-white [&_.ql-toolbar]:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving || loading} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save template"}
              </Button>
              <Button onClick={load} variant="outline" disabled={loading} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Reload
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <Label className="text-sm font-semibold">Send test email</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@email.com"
                  className="max-w-sm"
                />
                <Button onClick={sendTest} variant="outline" disabled={sending || loading} className="gap-2">
                  <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send test"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Test emails render sample values and do not affect the send log, so you can resend as often as you like.
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminMilestoneEmails;
