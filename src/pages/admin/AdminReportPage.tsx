import { useEffect, useState } from "react";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowUp, ArrowDown, Plus, Trash2, Camera } from "lucide-react";
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
];

// The 9-cell grid: category x score band. Each cell holds the suggested
// question shown as a chip, plus the grounding answer copy behind it.
const BANDS = [
  { key: "low", label: "0 to 33%" },
  { key: "mid", label: "34 to 75%" },
  { key: "high", label: "76 to 92%" },
] as const;

const CATEGORIES = [
  { key: "system", label: "System" },
  { key: "audience", label: "Audience" },
  { key: "conversion", label: "Conversion" },
] as const;

const QUESTION_PLACEHOLDERS: Record<string, string> = {
  low_system: "Why is my system score so low and what do I build first?",
  mid_system: "My system half works. What is the missing piece?",
  high_system: "My system is strong. How do I take myself out of it?",
  low_audience: "Why is my audience score low and who should I focus on?",
  mid_audience: "How do I make my message land with the right people?",
  high_audience: "How do I turn my reach into something people share?",
  low_conversion: "Why is my conversion score low and where am I losing people?",
  mid_conversion: "What is stopping interested people from committing?",
  high_conversion: "How do I make my conversions compound?",
};

const GROUNDING_PLACEHOLDERS: Record<string, string> = {
  low_system: "Your lead flow has no dependable hand-off from attention to action yet, so every result still asks for fresh effort from you.",
  low_audience: "Your message is still broad enough that the right people may not immediately recognise that it is meant for them.",
  low_conversion: "Interested people are being left to decide their own next step, which creates hesitation before trust can become action.",
  mid_system: "You have useful pieces in place, but they are operating separately. The gap is the sequence that turns them into a repeatable path.",
  mid_audience: "You are attracting some of the right people, but the promise is not yet specific enough to filter and focus that attention.",
  mid_conversion: "Your leads can see the value, but there is friction between interest and commitment. A guided next step would close that gap.",
  high_system: "Your system works, but it still relies on you at key moments. The next constraint is removing those manual points without losing trust.",
  high_audience: "You have earned attention. The missed opportunity is turning that reach into an experience people naturally share with others.",
  high_conversion: "Your conversion path is producing, but it is not yet compounding. Results need to create the proof and referrals that feed the next cycle.",
};

const GRID_KEYS: string[] = BANDS.flatMap((b) =>
  CATEGORIES.flatMap((c) => [`question_${b.key}_${c.key}`, `insight_${b.key}_${c.key}`]),
);


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

// The three category cards (System, Audience, Conversion) on the report page.
const CATEGORY_CARD_FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "card_position_system", label: "System card, order number", placeholder: "0" },
  {
    key: "tie_system",
    label: "System card, challenge day line",
    placeholder: "This is exactly what Day 2 fixes, when you build the asset that works without you.",
    multiline: true,
  },
  { key: "chip_label_system", label: "System card, button label", placeholder: "Get deeper advice" },
  {
    key: "chip_prompt_system",
    label: "System card, question sent to the advisor",
    placeholder:
      "My {category} score is {score}. Here is what I answered in that area: {answers} Based on those answers, what is the single biggest thing holding my lead system back, and what should I do about it first?",
    multiline: true,
  },
  { key: "card_position_audience", label: "Audience card, order number", placeholder: "1" },
  {
    key: "tie_audience",
    label: "Audience card, challenge day line",
    placeholder: "This is exactly what Day 1 fixes, when you lock the audience and the promise.",
    multiline: true,
  },
  { key: "chip_label_audience", label: "Audience card, button label", placeholder: "Get deeper advice" },
  {
    key: "chip_prompt_audience",
    label: "Audience card, question sent to the advisor",
    placeholder:
      "My {category} score is {score}. Here is what I answered in that area: {answers} Based on those answers, what is weakest about how I reach and position for my audience, and what should I change first?",
    multiline: true,
  },
  { key: "card_position_conversion", label: "Conversion card, order number", placeholder: "2" },
  {
    key: "tie_conversion",
    label: "Conversion card, challenge day line",
    placeholder:
      "This is exactly what Day 3 fixes, when you ship the follow-up that turns interest into clients.",
    multiline: true,
  },
  { key: "chip_label_conversion", label: "Conversion card, button label", placeholder: "Get deeper advice" },
  {
    key: "chip_prompt_conversion",
    label: "Conversion card, question sent to the advisor",
    placeholder:
      "My {category} score is {score}. Here is what I answered in that area: {answers} Based on those answers, where am I losing people between interest and commitment, and what should I fix first?",
    multiline: true,
  },
];

const GRID_FIELDS = GRID_KEYS.map((key) => ({
  key,
  label: key,
  placeholder: key.startsWith("question_")
    ? (QUESTION_PLACEHOLDERS[key.replace("question_", "")] ?? "")
    : (GROUNDING_PLACEHOLDERS[key.replace("insight_", "")] ?? ""),
  multiline: key.startsWith("insight_"),
}));

const ALL_FIELDS = [
  ...DEEPER_DIAGNOSIS_FIELDS,
  ...GRID_FIELDS,
  ...CATEGORY_CARD_FIELDS,
  ...REPORT_PAGE_FIELDS,
];

type PromptRow = { id: string; prompt: string; position: number };

const ARCHETYPE_IMAGE_FIELDS = [
  { key: "low_image", label: "Pioneer character image" },
  { key: "mid_image", label: "Architect character image" },
  { key: "high_image", label: "Authority character image" },
];

const ArchetypeImageUploader = ({
  fieldKey,
  label,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);

  // Persist a single image field immediately so no separate Save step is needed.
  const persist = async (url: string) => {
    onChange(url);
    const { error } = await supabase.from("site_content").upsert(
      { page: "results", section: "archetypes", key: fieldKey, value: url, value_type: "text", label },
      { onConflict: "page,section,key" },
    );
    if (error) {
      toast.error("Could not save the image. Try again.");
      return;
    }
    invalidatePage("results");
    toast.success(url ? "Image saved." : "Image removed.");
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp|gif)$/i.test(file.type)) {
      toast.error("Use a JPG, PNG, WEBP or GIF image.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `archetypes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("site-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      await persist(data.publicUrl);
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {value && (
        <div className="flex flex-col items-start gap-2">
          <img src={value} alt={label} className="max-h-48 w-full max-w-xs rounded-lg border object-cover" />
          <button
            type="button"
            className="text-sm text-red-500/80 underline hover:text-red-500"
            onClick={() => persist("")}
          >
            Remove image
          </button>
        </div>
      )}
      <label
        className={`flex items-center gap-3 rounded-md border border-dashed px-4 py-4 text-sm ${
          uploading ? "pointer-events-none opacity-60" : "cursor-pointer hover:bg-muted/50"
        }`}
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
        <span>{uploading ? "Uploading…" : value ? "Replace image" : "Upload an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>
    </div>
  );
};

const AdminReportPage = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [prompts, setPrompts] = useState<PromptRow[] | null>(null);
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [removedPromptIds, setRemovedPromptIds] = useState<string[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "results")
      .eq("section", "archetypes")
      .then(({ data }) => {
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[r.key] = r.value;
        setImages(v);
      });
  }, []);


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
              <CardTitle className="text-lg">Archetype images</CardTitle>
              <CardDescription>
                One picture per archetype, shown above the score on the emailed report page. Saves as soon as the upload finishes. Leave blank for none.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ARCHETYPE_IMAGE_FIELDS.map((f) => (
                <ArchetypeImageUploader
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  value={images[f.key] ?? ""}
                  onChange={(url) => setImages((prev) => ({ ...prev, [f.key]: url }))}
                />
              ))}
            </CardContent>
          </Card>

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
                  <CardTitle className="text-lg">Questions and answers by score</CardTitle>
                  <CardDescription>
                    One box for each area and score range. The suggested question is the wording the
                    person sees on their chip. The grounding answer is the copy the advisor answers from.
                  </CardDescription>
                </div>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {BANDS.map((b) => (
                <div key={b.key} className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Score {b.label}
                  </h3>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {CATEGORIES.map((c) => {
                      const qKey = `question_${b.key}_${c.key}`;
                      const aKey = `insight_${b.key}_${c.key}`;
                      return (
                        <div key={c.key} className="space-y-3 rounded-lg border border-border p-4">
                          <p className="text-sm font-semibold text-foreground">{c.label}</p>
                          <div className="space-y-1.5">
                            <Label>Suggested question</Label>
                            <Input
                              value={values[qKey] ?? ""}
                              placeholder={QUESTION_PLACEHOLDERS[`${b.key}_${c.key}`]}
                              onChange={(e) => set(qKey, e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Grounding answer</Label>
                            <Textarea
                              rows={4}
                              value={values[aKey] ?? ""}
                              placeholder={GROUNDING_PLACEHOLDERS[`${b.key}_${c.key}`]}
                              onChange={(e) => set(aKey, e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  <CardTitle className="text-lg">Category cards</CardTitle>
                  <CardDescription>
                    The three cards for System, Audience and Conversion. Lower order numbers show first.
                    In the advisor question you can use {"{category}"}, {"{score}"} and {"{answers}"} to
                    pull in their own quiz answers.
                  </CardDescription>
                </div>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {CATEGORY_CARD_FIELDS.map((f) => (
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
