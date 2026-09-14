import { useEffect, useState } from "react";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

const DEEPER_DIAGNOSIS_FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  {
    key: "deep_intro",
    label: "Personalised opening line",
    placeholder: "{name}, you've seen the score. Now let's go deeper.",
  },
  {
    key: "insights_heading",
    label: "Deeper insight heading",
    placeholder: "The gaps underneath your result",
  },
  {
    key: "advisor_heading",
    label: "Suggested questions heading",
    placeholder: "Ask about your result",
  },
  {
    key: "advisor_subline",
    label: "Suggested questions intro line",
    placeholder: "Pick a question and get an answer built around what your report shows.",
    multiline: true,
  },
  {
    key: "insight_low_system",
    label: "Pioneer — System blocker",
    placeholder: "Your lead flow has no dependable hand-off from attention to action yet, so every result still asks for fresh effort from you.",
    multiline: true,
  },
  {
    key: "insight_low_audience",
    label: "Pioneer — Audience blocker",
    placeholder: "Your message is still broad enough that the right people may not immediately recognise that it is meant for them.",
    multiline: true,
  },
  {
    key: "insight_low_conversion",
    label: "Pioneer — Conversion blocker",
    placeholder: "Interested people are being left to decide their own next step, which creates hesitation before trust can become action.",
    multiline: true,
  },
  {
    key: "insight_mid_system",
    label: "Architect — System blocker",
    placeholder: "You have useful pieces in place, but they are operating separately. The gap is the sequence that turns them into a repeatable path.",
    multiline: true,
  },
  {
    key: "insight_mid_audience",
    label: "Architect — Audience blocker",
    placeholder: "You are attracting some of the right people, but the promise is not yet specific enough to filter and focus that attention.",
    multiline: true,
  },
  {
    key: "insight_mid_conversion",
    label: "Architect — Conversion blocker",
    placeholder: "Your leads can see the value, but there is friction between interest and commitment. A guided next step would close that gap.",
    multiline: true,
  },
  {
    key: "insight_high_system",
    label: "Authority — System blocker",
    placeholder: "Your system works, but it still relies on you at key moments. The next constraint is removing those manual points without losing trust.",
    multiline: true,
  },
  {
    key: "insight_high_audience",
    label: "Authority — Audience blocker",
    placeholder: "You have earned attention. The missed opportunity is turning that reach into an experience people naturally share with others.",
    multiline: true,
  },
  {
    key: "insight_high_conversion",
    label: "Authority — Conversion blocker",
    placeholder: "Your conversion path is producing, but it is not yet compounding. Results need to create the proof and referrals that feed the next cycle.",
    multiline: true,
  },
];

// The emailed report page (/r/:token) copy.
const REPORT_PAGE_FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "tease_heading", label: "Teaser heading", placeholder: "What the 3-Day Challenge does about this" },
  {
    key: "tease_day1",
    label: "Teaser line 1",
    placeholder: "Step one: shape a promise your audience recognises, so the right people lean in.",
    multiline: true,
  },
  {
    key: "tease_day2",
    label: "Teaser line 2",
    placeholder: "Step two: turn that promise into a simple quiz that brings you leads while you sleep.",
    multiline: true,
  },
  {
    key: "tease_day3",
    label: "Teaser line 3",
    placeholder: "Step three: put a follow-up sequence behind it so interest turns into paying clients.",
    multiline: true,
  },
  { key: "cta_heading", label: "Closing heading", placeholder: "Ready to fix it for good?" },
  {
    key: "cta_body",
    label: "Closing body",
    placeholder: "Join the free 3-day challenge and build the system your report points to, step by step.",
    multiline: true,
  },
  { key: "cta_button", label: "Button label", placeholder: "Join the 3-Day Challenge" },
  { key: "error_heading", label: "Report not available, heading", placeholder: "Report not available" },
  {
    key: "error_body",
    label: "Report not available, body",
    placeholder: "We could not find a report for this link. It may be incomplete or no longer valid.",
    multiline: true,
  },
];

const ALL_FIELDS = [...DEEPER_DIAGNOSIS_FIELDS, ...REPORT_PAGE_FIELDS];

type PromptRow = { id: string; prompt: string; position: number };

const AdminReportPage = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState<PromptRow[] | null>(null);
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [removedPromptIds, setRemovedPromptIds] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "results")
      .eq("section", "report_page")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load the report page copy");
          return;
        }
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[r.key] = r.value;
        setValues(v);
      });
  }, []);

  useEffect(() => {
    supabase
      .from("report_advisor_prompts")
      .select("id,prompt,position")
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load the suggested questions");
          setPrompts([]);
          return;
        }
        setPrompts((data ?? []).map((r) => ({ id: r.id, prompt: r.prompt, position: r.position })));
      });
  }, []);

  const setPromptText = (id: string, prompt: string) =>
    setPrompts((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, prompt } : p)) : prev));

  const movePrompt = (index: number, delta: number) =>
    setPrompts((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addPrompt = () =>
    setPrompts((prev) => [
      ...(prev ?? []),
      { id: `new-${crypto.randomUUID()}`, prompt: "", position: (prev?.length ?? 0) },
    ]);

  const removePrompt = (id: string) => {
    if (!id.startsWith("new-")) setRemovedPromptIds((prev) => [...prev, id]);
    setPrompts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
  };

  const savePrompts = async () => {
    if (!prompts) return;
    setSavingPrompts(true);
    const cleaned = prompts
      .map((p) => ({ ...p, prompt: p.prompt.trim() }))
      .filter((p) => p.prompt.length > 0)
      .map((p, i) => ({ ...p, position: i }));

    if (removedPromptIds.length > 0) {
      const { error } = await supabase
        .from("report_advisor_prompts")
        .delete()
        .in("id", removedPromptIds);
      if (error) {
        setSavingPrompts(false);
        toast.error("Could not remove a question");
        return;
      }
      setRemovedPromptIds([]);
    }

    const inserts = cleaned
      .filter((p) => p.id.startsWith("new-"))
      .map((p) => ({ prompt: p.prompt, position: p.position }));
    const updates = cleaned.filter((p) => !p.id.startsWith("new-"));

    for (const u of updates) {
      const { error } = await supabase
        .from("report_advisor_prompts")
        .update({ prompt: u.prompt, position: u.position })
        .eq("id", u.id);
      if (error) {
        setSavingPrompts(false);
        toast.error("Could not save the questions");
        return;
      }
    }
    if (inserts.length > 0) {
      const { error } = await supabase.from("report_advisor_prompts").insert(inserts);
      if (error) {
        setSavingPrompts(false);
        toast.error("Could not save the new questions");
        return;
      }
    }

    const { data } = await supabase
      .from("report_advisor_prompts")
      .select("id,prompt,position")
      .order("position", { ascending: true });
    setPrompts((data ?? []).map((r) => ({ id: r.id, prompt: r.prompt, position: r.position })));
    setSavingPrompts(false);
    toast.success("Saved");
  };


  const set = (key: string, value: string) => setValues((prev) => ({ ...(prev ?? {}), [key]: value }));

  const save = async () => {
    const rows = ALL_FIELDS.map((f, i) => ({
      page: "results",
      section: "report_page",
      key: f.key,
      value: values?.[f.key] ?? "",
      value_type: "text",
      label: f.label,
      sort_order: i,
    })).filter((r) => (r.value ?? "").trim() !== "");

    if (rows.length === 0) {
      toast.error("Nothing to save yet");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "page,section,key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    invalidatePage("results");
    toast.success("Saved");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Results Page Editor - Non-signup
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The page a lead opens from the link we email them.
          </p>
        </div>
        <PreviewButton href="/r/sample" />
      </div>

      {!values ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Deeper diagnosis</CardTitle>
                <CardDescription>
                  Opening and blocker insights shown after the lead has already seen their score. Use {"{name}"} to insert their first name.
                </CardDescription>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {DEEPER_DIAGNOSIS_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.multiline ? (
                  <Textarea
                    rows={3}
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Suggested questions</CardTitle>
                  <CardDescription>
                    The clickable questions shown under the deeper diagnosis. They appear in the order below, top first.
                  </CardDescription>
                </div>
                <Button onClick={savePrompts} disabled={savingPrompts || !prompts}>
                  {savingPrompts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!prompts ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  {prompts.map((p, i) => (
                    <div key={p.id} className="flex items-start gap-2">
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => movePrompt(i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => movePrompt(i, 1)}
                          disabled={i === prompts.length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={p.prompt}
                        placeholder={`Question ${i + 1}`}
                        onChange={(e) => setPromptText(p.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrompt(p.id)}
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPrompt}>
                    <Plus className="h-4 w-4 mr-1" /> Add question
                  </Button>
                </>
              )}
            </CardContent>
          </Card>



          <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Page wording</CardTitle>
                <CardDescription>
                  Challenge teaser, join button and the message shown when a link no longer works.
                </CardDescription>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {REPORT_PAGE_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.multiline ? (
                  <Textarea
                    rows={2}
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminReportPage;
