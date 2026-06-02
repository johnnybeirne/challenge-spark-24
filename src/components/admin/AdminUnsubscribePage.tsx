import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type PageConfig = {
  id: number;
  ready_heading: string; ready_body: string; confirm_button_label: string;
  done_heading: string; done_body: string;
  already_heading: string; already_body: string;
  error_heading: string; error_body: string;
  feedback_enabled: boolean; feedback_prompt: string; feedback_placeholder: string;
  feedback_submit_label: string; feedback_skip_label: string;
  resubscribe_enabled: boolean; resubscribe_label: string; resubscribe_success: string;
};

type Feedback = { id: string; email: string; reason: string; created_at: string };

const Field = ({ label, value, onChange, multiline = false, hint }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; hint?: string;
}) => (
  <div className="space-y-1">
    <Label className="text-xs font-medium">{label}</Label>
    {multiline ? (
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    ) : (
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    )}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const AdminUnsubscribePage = () => {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [appBaseUrl, setAppBaseUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: cfg }, { data: settings }, { data: fb }] = await Promise.all([
      supabase.from("unsubscribe_page_config").select("*").eq("id", 1).maybeSingle(),
      supabase.from("newsletter_settings").select("app_base_url").eq("id", 1).maybeSingle(),
      supabase.from("unsubscribe_feedback").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (cfg) setConfig(cfg as PageConfig);
    if (settings) setAppBaseUrl(settings.app_base_url ?? "");
    setFeedback((fb ?? []) as Feedback[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    const { id, ...rest } = config;
    const [a, b] = await Promise.all([
      supabase.from("unsubscribe_page_config").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", 1),
      supabase.from("newsletter_settings").update({ app_base_url: appBaseUrl.trim(), updated_at: new Date().toISOString() }).eq("id", 1),
    ]);
    setSaving(false);
    if (a.error || b.error) {
      toast.error(a.error?.message || b.error?.message || "Save failed");
    } else {
      toast.success("Unsubscribe page updated");
    }
  };

  if (loading || !config) {
    return <div className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }

  const set = <K extends keyof PageConfig>(k: K, v: PageConfig[K]) =>
    setConfig((c) => (c ? { ...c, [k]: v } : c));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Email link base URL</h3>
            <p className="text-xs text-muted-foreground">Used for unsubscribe and referral links in newsletter emails. No trailing slash.</p>
          </div>
          <Field label="App base URL" value={appBaseUrl} onChange={setAppBaseUrl} hint="e.g. https://leadio.johnnybeirne.com" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Landing page copy</h3>
            <p className="text-xs text-muted-foreground">Use <code className="text-[11px]">{"{{email}}"}</code> to insert the recipient's email.</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Before they confirm</h4>
            <Field label="Heading" value={config.ready_heading} onChange={(v) => set("ready_heading", v)} />
            <Field label="Body" value={config.ready_body} onChange={(v) => set("ready_body", v)} multiline />
            <Field label="Confirm button label" value={config.confirm_button_label} onChange={(v) => set("confirm_button_label", v)} />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">After they unsubscribe</h4>
            <Field label="Heading" value={config.done_heading} onChange={(v) => set("done_heading", v)} />
            <Field label="Body" value={config.done_body} onChange={(v) => set("done_body", v)} multiline />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Already unsubscribed</h4>
            <Field label="Heading" value={config.already_heading} onChange={(v) => set("already_heading", v)} />
            <Field label="Body" value={config.already_body} onChange={(v) => set("already_body", v)} multiline />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Error</h4>
            <Field label="Heading" value={config.error_heading} onChange={(v) => set("error_heading", v)} />
            <Field label="Body" value={config.error_body} onChange={(v) => set("error_body", v)} multiline />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Reason for leaving</h3>
              <p className="text-xs text-muted-foreground">Ask why they're unsubscribing right after they confirm.</p>
            </div>
            <Switch checked={config.feedback_enabled} onCheckedChange={(v) => set("feedback_enabled", v)} />
          </div>
          {config.feedback_enabled && (
            <>
              <Field label="Prompt" value={config.feedback_prompt} onChange={(v) => set("feedback_prompt", v)} />
              <Field label="Placeholder" value={config.feedback_placeholder} onChange={(v) => set("feedback_placeholder", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Submit button" value={config.feedback_submit_label} onChange={(v) => set("feedback_submit_label", v)} />
                <Field label="Skip button" value={config.feedback_skip_label} onChange={(v) => set("feedback_skip_label", v)} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Resubscribe button</h3>
              <p className="text-xs text-muted-foreground">Let people undo their unsubscribe with one click.</p>
            </div>
            <Switch checked={config.resubscribe_enabled} onCheckedChange={(v) => set("resubscribe_enabled", v)} />
          </div>
          {config.resubscribe_enabled && (
            <>
              <Field label="Button label" value={config.resubscribe_label} onChange={(v) => set("resubscribe_label", v)} />
              <Field label="Success message" value={config.resubscribe_success} onChange={(v) => set("resubscribe_success", v)} multiline />
            </>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Recent feedback ({feedback.length})</h3>
            <p className="text-xs text-muted-foreground">Reasons people gave when they unsubscribed.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f) => (
                <tr key={f.id} className="border-t align-top">
                  <td className="p-3 font-medium">{f.email}</td>
                  <td className="p-3 whitespace-pre-wrap">{f.reason}</td>
                  <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(f.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {feedback.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No feedback yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUnsubscribePage;
