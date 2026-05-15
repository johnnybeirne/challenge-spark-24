import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, Users, Trash2, Loader2, FileText, Save, Sparkles } from "lucide-react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];
const SizeStyle: any = (Quill as any).import("attributors/style/size");
SizeStyle.whitelist = FONT_SIZES;
(Quill as any).register(SizeStyle, true);

const TIERS = ["Founder", "Accelerator", "Builder", "Mover", "Starter", "Joined"];

type WaitlistRow = { id: string; email: string; name: string | null; current_tier: string; confirmed_invites: number; created_at: string };
type Campaign = {
  id: string; subject: string; status: string;
  recipient_count: number; sent_count: number; failed_count: number; unsubscribe_count: number;
  created_at: string; sent_at: string | null;
};
type SendRow = { id: string; email: string; name: string | null; status: string; error_message: string | null; sent_at: string | null };
type Suppression = { id: string; email: string; unsubscribed_at: string; source_campaign_id: string | null };
type Template = { id: string; name: string; subject: string; html_body: string; is_welcome: boolean; updated_at: string };

const DEFAULT_HTML = `<p>Hi {{name}},</p><p>Quick update from the team...</p><p>— Johnny</p>`;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ size: FONT_SIZES }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const AdminNewsletter = () => {
  const [tab, setTab] = useState("compose");

  // Compose state
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [audienceMode, setAudienceMode] = useState<"all" | "filter" | "manual">("all");
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [minInvites, setMinInvites] = useState<number>(0);
  const [signedUpAfter, setSignedUpAfter] = useState<string>(""); // datetime-local value (local time)
  const [manualIds, setManualIds] = useState<Set<string>>(new Set());
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [suppressedSet, setSuppressedSet] = useState<Set<string>>(new Set());
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Campaigns / suppressions / templates
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [drillCampaign, setDrillCampaign] = useState<Campaign | null>(null);
  const [drillRows, setDrillRows] = useState<SendRow[]>([]);

  // Save-template dialog
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTargetId, setSaveTargetId] = useState<string>("__new__");
  const [saveName, setSaveName] = useState("");
  const [saveAsWelcome, setSaveAsWelcome] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Welcome auto-send toggle
  const [autoSendEnabled, setAutoSendEnabled] = useState<boolean>(false);
  const [autoSendLoading, setAutoSendLoading] = useState(false);

  const loadAutoSend = async () => {
    const { data, error } = await supabase.rpc("get_welcome_auto_send");
    if (!error) setAutoSendEnabled(Boolean(data));
  };

  const toggleAutoSend = async (next: boolean) => {
    setAutoSendLoading(true);
    const { error } = await supabase.rpc("set_welcome_auto_send", { p_enabled: next });
    setAutoSendLoading(false);
    if (error) { toast.error("Could not update setting"); return; }
    setAutoSendEnabled(next);
    toast.success(next ? "Welcome auto-send enabled" : "Welcome auto-send paused");
  };

  const loadAll = async () => {
    const [{ data: w }, { data: c }, { data: s }, { data: t }] = await Promise.all([
      supabase.from("waitlist_signups").select("id,email,name,current_tier,confirmed_invites,created_at").eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_suppressions").select("*").order("unsubscribed_at", { ascending: false }),
      supabase.from("newsletter_templates").select("*").order("updated_at", { ascending: false }),
    ]);
    setWaitlist((w ?? []) as WaitlistRow[]);
    setCampaigns((c ?? []) as Campaign[]);
    setSuppressions((s ?? []) as Suppression[]);
    setTemplates((t ?? []) as Template[]);
    setSuppressedSet(new Set((s ?? []).map((r: any) => (r.email as string).toLowerCase())));
  };

  useEffect(() => { loadAll(); loadAutoSend(); }, []);

  const loadTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setHtml(t.html_body);
    toast.success(`Loaded template: ${t.name}`);
  };

  const openSaveDialog = () => {
    if (!subject.trim() || !html.trim()) { toast.error("Subject and body required"); return; }
    setSaveTargetId("__new__");
    setSaveName("");
    setSaveAsWelcome(false);
    setSaveOpen(true);
  };

  const onSaveTargetChange = (val: string) => {
    setSaveTargetId(val);
    if (val === "__new__") {
      setSaveName("");
      setSaveAsWelcome(false);
    } else {
      const t = templates.find((x) => x.id === val);
      if (t) { setSaveName(t.name); setSaveAsWelcome(t.is_welcome); }
    }
  };

  const saveTemplate = async () => {
    if (!saveName.trim()) { toast.error("Name required"); return; }
    setSavingTemplate(true);
    const { data: userRes } = await supabase.auth.getUser();

    // If marking as welcome, first clear any existing welcome flag (unique partial index)
    if (saveAsWelcome) {
      await supabase.from("newsletter_templates").update({ is_welcome: false }).eq("is_welcome", true);
    }

    if (saveTargetId === "__new__") {
      const { error } = await supabase.from("newsletter_templates").insert({
        name: saveName.trim(), subject: subject.trim(), html_body: html,
        is_welcome: saveAsWelcome, created_by: userRes?.user?.id ?? null,
      });
      if (error) { toast.error(error.message); setSavingTemplate(false); return; }
    } else {
      const { error } = await supabase.from("newsletter_templates").update({
        name: saveName.trim(), subject: subject.trim(), html_body: html, is_welcome: saveAsWelcome,
      }).eq("id", saveTargetId);
      if (error) { toast.error(error.message); setSavingTemplate(false); return; }
    }
    setSavingTemplate(false);
    setSaveOpen(false);
    toast.success(saveAsWelcome ? "Saved — now the welcome email" : "Template saved");
    loadAll();
  };

  const setAsWelcome = async (id: string, value: boolean) => {
    if (value) {
      await supabase.from("newsletter_templates").update({ is_welcome: false }).eq("is_welcome", true);
    }
    const { error } = await supabase.from("newsletter_templates").update({ is_welcome: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(value ? "Set as welcome email" : "Removed welcome flag");
    loadAll();
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("newsletter_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Template deleted");
    loadAll();
  };

  const signedUpAfterIso = useMemo(
    () => (signedUpAfter ? new Date(signedUpAfter).toISOString() : null),
    [signedUpAfter],
  );

  const filteredAudience = useMemo(() => {
    let rows = waitlist.filter((r) => r.email && !suppressedSet.has(r.email.toLowerCase()));
    if (audienceMode === "filter") {
      if (tierFilter.length) rows = rows.filter((r) => tierFilter.includes(r.current_tier));
      if (minInvites > 0) rows = rows.filter((r) => r.confirmed_invites >= minInvites);
      if (signedUpAfterIso) rows = rows.filter((r) => r.created_at > signedUpAfterIso);
    } else if (audienceMode === "manual") {
      rows = rows.filter((r) => manualIds.has(r.id));
    }
    return rows;
  }, [waitlist, suppressedSet, audienceMode, tierFilter, minInvites, signedUpAfterIso, manualIds]);

  const buildAudience = () => {
    if (audienceMode === "all") return { mode: "all" };
    if (audienceMode === "filter") return { mode: "filter", tiers: tierFilter, minInvites, signedUpAfter: signedUpAfterIso };
    return { mode: "manual", ids: Array.from(manualIds) };
  };

  const createCampaign = async () => {
    if (!subject.trim() || !html.trim()) { toast.error("Subject and body required"); return null; }
    const { data: userRes } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("newsletter_campaigns").insert({
      subject: subject.trim(), html_body: html, audience: buildAudience(),
      created_by: userRes?.user?.id ?? null, status: "draft",
    }).select("id").single();
    if (error) { toast.error(error.message); return null; }
    return data.id as string;
  };

  const sendTest = async () => {
    if (!testEmail.includes("@")) { toast.error("Enter a valid test email"); return; }
    setSending(true);
    const id = await createCampaign();
    if (!id) { setSending(false); return; }
    const { data, error } = await supabase.functions.invoke("send-newsletter", {
      body: { campaignId: id, mode: "test", testEmail, testName: testName.trim() || undefined },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Test failed");
    } else {
      const rendered = (data as any)?.renderedSubject;
      toast.success(`Test sent to ${testEmail}`, rendered ? { description: `Subject: ${rendered}` } : undefined);
    }
    // delete the draft test campaign so it doesn't clutter history
    await supabase.from("newsletter_campaigns").delete().eq("id", id);
  };

  const sendBroadcast = async () => {
    setConfirmOpen(false);
    setSending(true);
    const id = await createCampaign();
    if (!id) { setSending(false); return; }
    toast.info(`Sending to ${filteredAudience.length} recipient${filteredAudience.length === 1 ? "" : "s"}...`);
    const { data, error } = await supabase.functions.invoke("send-newsletter", {
      body: { campaignId: id, mode: "send" },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Send failed");
    } else {
      const r = data as { sent: number; failed: number; recipients: number };
      toast.success(`Done: ${r.sent} sent, ${r.failed} failed`);
      setSubject(""); setHtml(DEFAULT_HTML);
      setTab("campaigns");
      loadAll();
    }
  };

  const openCampaignDetail = async (c: Campaign) => {
    setDrillCampaign(c);
    const { data } = await supabase.from("newsletter_sends").select("*").eq("campaign_id", c.id).order("created_at", { ascending: false });
    setDrillRows((data ?? []) as SendRow[]);
  };

  const removeSuppression = async (id: string) => {
    const { error } = await supabase.from("newsletter_suppressions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from suppression list");
    loadAll();
  };

  const toggleManual = (id: string) => {
    setManualIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Newsletter</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="compose">Compose &amp; send</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="unsubscribes">Unsubscribes ({suppressions.length})</TabsTrigger>
        </TabsList>

        {/* COMPOSE */}
        <TabsContent value="compose" className="space-y-6">
          <Card><CardContent className="p-6 space-y-4">
            {templates.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs">Load saved template</Label>
                  <Select onValueChange={loadTemplate}>
                    <SelectTrigger><SelectValue placeholder="Pick a template…" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}{t.is_welcome ? " — Welcome" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={openSaveDialog} disabled={!subject.trim()}>
                  <Save className="h-4 w-4 mr-2" /> Save as template
                </Button>
              </div>
            )}
            {templates.length === 0 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={openSaveDialog} disabled={!subject.trim()}>
                  <Save className="h-4 w-4 mr-2" /> Save as template
                </Button>
              </div>
            )}

            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" maxLength={200} />
            </div>

            <div>
              <Label>Body</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Tokens: <code>{"{{name}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{referral_url}}"}</code>, <code>{"{{referral_code}}"}</code>, <code>{"{{unsubscribe_url}}"}</code>. URL tokens become clickable links automatically — or use the link button in the toolbar to wrap your own text.
              </p>
              <div className="bg-background border rounded-md">
                <ReactQuill theme="snow" value={html} onChange={setHtml} modules={quillModules} />
              </div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h2 className="font-semibold">Audience</h2>
              </div>
              <Badge variant="secondary">{filteredAudience.length} recipient{filteredAudience.length === 1 ? "" : "s"}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "filter", "manual"] as const).map((m) => (
                <Button key={m} size="sm" variant={audienceMode === m ? "default" : "outline"} onClick={() => setAudienceMode(m)}>
                  {m === "all" ? "All active" : m === "filter" ? "Filter" : "Manual select"}
                </Button>
              ))}
            </div>

            {audienceMode === "filter" && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs">Tiers (none selected = all)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TIERS.map((t) => {
                      const active = tierFilter.includes(t);
                      return (
                        <Button key={t} type="button" size="sm" variant={active ? "default" : "outline"}
                          onClick={() => setTierFilter((p) => active ? p.filter((x) => x !== t) : [...p, t])}>
                          {t}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Min confirmed invites:</Label>
                  <Input type="number" min={0} value={minInvites} onChange={(e) => setMinInvites(parseInt(e.target.value || "0", 10))} className="w-24" />
                </div>
              </div>
            )}

            {audienceMode === "manual" && (
              <div className="border rounded-md max-h-80 overflow-auto divide-y">
                {waitlist.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 p-2 text-sm cursor-pointer hover:bg-muted/40">
                    <Checkbox checked={manualIds.has(r.id)} onCheckedChange={() => toggleManual(r.id)} />
                    <span className="font-medium">{r.name || "—"}</span>
                    <span className="text-muted-foreground">{r.email}</span>
                    <Badge variant="outline" className="ml-auto">{r.current_tier}</Badge>
                  </label>
                ))}
              </div>
            )}
          </CardContent></Card>

          <Card><CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <Label>Test name <span className="text-muted-foreground font-normal">(used for {"{{name}}"})</span></Label>
                <Input placeholder="Jane" value={testName} onChange={(e) => setTestName(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label>Test email</Label>
                <Input type="email" placeholder="you@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
              </div>
              <Button variant="outline" onClick={sendTest} disabled={sending || !subject.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send test
              </Button>
            </div>

            <div className="flex justify-start pt-2 border-t">
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={sending || !subject.trim() || filteredAudience.length === 0}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send to {filteredAudience.length} recipient{filteredAudience.length === 1 ? "" : "s"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Confirm send</DialogTitle></DialogHeader>
                  <p className="text-sm">
                    Send "<strong>{subject}</strong>" to <strong>{filteredAudience.length}</strong> recipient{filteredAudience.length === 1 ? "" : "s"}?
                  </p>
                  <p className="text-xs text-muted-foreground">This may take a minute. Don't close the page until it finishes.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={sendBroadcast}>Send now</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Recipients</th>
                  <th className="text-right p-3">Sent</th>
                  <th className="text-right p-3">Failed</th>
                  <th className="text-left p-3">Sent at</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => openCampaignDetail(c)}>
                    <td className="p-3 font-medium">{c.subject}</td>
                    <td className="p-3"><Badge variant={c.status === "sent" ? "default" : c.status === "sending" ? "secondary" : "outline"}>{c.status}</Badge></td>
                    <td className="p-3 text-right">{c.recipient_count}</td>
                    <td className="p-3 text-right text-green-600">{c.sent_count}</td>
                    <td className="p-3 text-right text-red-600">{c.failed_count}</td>
                    <td className="p-3 text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No campaigns yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent></Card>

          <Dialog open={!!drillCampaign} onOpenChange={(o) => !o && setDrillCampaign(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>{drillCampaign?.subject}</DialogTitle></DialogHeader>
              <div className="max-h-[60vh] overflow-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase sticky top-0">
                    <tr><th className="text-left p-2">Recipient</th><th className="text-left p-2">Status</th><th className="text-left p-2">Error</th></tr>
                  </thead>
                  <tbody>
                    {drillRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2"><div className="font-medium">{r.name || "—"}</div><div className="text-xs text-muted-foreground">{r.email}</div></td>
                        <td className="p-2"><Badge variant={r.status === "sent" ? "default" : "destructive"}>{r.status}</Badge></td>
                        <td className="p-2 text-xs text-red-600 max-w-md truncate">{r.error_message || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* UNSUBSCRIBES */}
        <TabsContent value="unsubscribes">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase">
                <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Unsubscribed</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {suppressions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3 font-medium">{s.email}</td>
                    <td className="p-3 text-muted-foreground">{new Date(s.unsubscribed_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => removeSuppression(s.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </td>
                  </tr>
                ))}
                {suppressions.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No unsubscribes.</td></tr>}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates">
          <Card><CardContent className="p-0">
            <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  When enabled, the template marked <strong>Welcome</strong> is sent automatically to every new waitlist signup.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-send-toggle" className="text-xs font-medium">
                  Auto-send {autoSendEnabled ? "on" : "off"}
                </Label>
                <Switch
                  id="auto-send-toggle"
                  checked={autoSendEnabled}
                  disabled={autoSendLoading}
                  onCheckedChange={toggleAutoSend}
                />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Updated</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {t.name}
                        {t.is_welcome && <Badge variant="default" className="ml-1">Welcome</Badge>}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-xs">{t.subject}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(t.updated_at).toLocaleString()}</td>
                    <td className="p-3 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { loadTemplate(t.id); setTab("compose"); }}>Load</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAsWelcome(t.id, !t.is_welcome)}>
                        {t.is_welcome ? "Unset welcome" : "Set as welcome"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTemplate(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No templates yet. Compose an email and click "Save as template" to create one.
                  </td></tr>
                )}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* SAVE TEMPLATE DIALOG */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save template</DialogTitle>
            <DialogDescription>Save the current subject + body so you can reuse it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {templates.length > 0 && (
              <div>
                <Label className="text-xs">Save as</Label>
                <Select value={saveTargetId} onValueChange={onSaveTargetChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__">New template…</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>Overwrite: {t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Template name</Label>
              <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="e.g. Welcome to the waitlist" />
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={saveAsWelcome} onCheckedChange={(v) => setSaveAsWelcome(!!v)} className="mt-0.5" />
              <span>
                <strong>Use as the welcome email</strong> for new waitlist signups.
                <span className="block text-xs text-muted-foreground">
                  Replaces any existing welcome template. Sends automatically on signup.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={savingTemplate}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={savingTemplate || !saveName.trim()}>
              {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNewsletter;
