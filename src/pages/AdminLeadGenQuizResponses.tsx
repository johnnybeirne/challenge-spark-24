import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, MessageCircle, Sparkles } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

type Row = {
  id: string;
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

const TIER_LABEL: Record<string, string> = {
  low: "Lower tier",
  mid: "Middle tier",
  high: "Upper tier",
};

const TIER_ORDER = ["low", "mid", "high"];

type Archetype = {
  tier: "low" | "mid" | "high";
  name: string;
  tagline: string;
};

const DEFAULT_ARCHETYPES: Archetype[] = [
  { tier: "low", name: "You're a Pioneer", tagline: "You're building the foundation. Let's make it solid." },
  { tier: "mid", name: "You're an Architect", tagline: "You have the pieces. Now let's connect them." },
  { tier: "high", name: "You're an Authority", tagline: "You've built something real. Now let's make it grow." },
];

const AdminLeadGenQuizResponses = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [intro, setIntro] = useState<string>("Based on your answers...");
  const [archetypes, setArchetypes] = useState<Archetype[]>(DEFAULT_ARCHETYPES);
  const [savingArchetypes, setSavingArchetypes] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("diagnostic_responses")
      .select("id,tier,min_percent,max_percent,title,messages");
    if (error) {
      toast.error("Could not load responses");
      return;
    }
    const normalised: Row[] = (data ?? []).map((r: any) => ({
      id: r.id,
      tier: r.tier,
      min_percent: r.min_percent,
      max_percent: r.max_percent,
      title: r.title,
      messages: Array.isArray(r.messages) ? r.messages.filter((m: any) => typeof m === "string") : [],
    }));
    normalised.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
    setRows(normalised);
  };

  const loadArchetypes = async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "results")
      .eq("section", "archetypes");
    if (error || !data) return;
    const map: Record<string, string> = {};
    for (const r of data) map[r.key] = r.value;
    if (map.intro) setIntro(map.intro);
    setArchetypes(
      (["low", "mid", "high"] as const).map((tier, i) => ({
        tier,
        name: map[`${tier}_name`] ?? DEFAULT_ARCHETYPES[i].name,
        tagline: map[`${tier}_tagline`] ?? DEFAULT_ARCHETYPES[i].tagline,
      })),
    );
  };

  useEffect(() => {
    load();
    loadArchetypes();
  }, []);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev));
  };

  const updateMessage = (id: string, index: number, value: string) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.id === id ? { ...r, messages: r.messages.map((m, i) => (i === index ? value : m)) } : r,
          )
        : prev,
    );
  };

  const addMessage = (id: string) => {
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, messages: [...r.messages, ""] } : r)) : prev,
    );
  };

  const removeMessage = (id: string, index: number) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.id === id ? { ...r, messages: r.messages.filter((_, i) => i !== index) } : r,
          )
        : prev,
    );
  };

  const updateArchetype = (tier: Archetype["tier"], patch: Partial<Archetype>) => {
    setArchetypes((prev) => prev.map((a) => (a.tier === tier ? { ...a, ...patch } : a)));
  };

  const save = async (row: Row) => {
    const minP = Math.max(0, Math.min(100, Math.round(Number(row.min_percent) || 0)));
    const maxP = Math.max(0, Math.min(100, Math.round(Number(row.max_percent) || 0)));
    if (maxP < minP) {
      toast.error("Max % must be greater than or equal to Min %");
      return;
    }
    setSavingId(row.id);
    const cleanedMessages = row.messages.map((m) => m.trim()).filter(Boolean);
    const { error } = await supabase
      .from("diagnostic_responses")
      .update({
        title: row.title.trim(),
        messages: cleanedMessages,
        min_percent: minP,
        max_percent: maxP,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success("Saved");
    updateRow(row.id, { messages: cleanedMessages, min_percent: minP, max_percent: maxP });
  };

  const saveArchetypes = async () => {
    setSavingArchetypes(true);
    const upserts = [
      { page: "results", section: "archetypes", key: "intro", value: intro.trim(), value_type: "text" },
      ...archetypes.flatMap((a) => [
        { page: "results", section: "archetypes", key: `${a.tier}_name`, value: a.name.trim(), value_type: "text" },
        { page: "results", section: "archetypes", key: `${a.tier}_tagline`, value: a.tagline.trim(), value_type: "text" },
      ]),
    ];
    const { error } = await supabase
      .from("site_content")
      .upsert(upserts, { onConflict: "page,section,key" });
    setSavingArchetypes(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    invalidatePage("results");
    toast.success("Archetypes saved");
  };

  if (!rows) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Lead Gen Quiz Responses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the score ranges, archetype labels, and the chat shown on the Results page.
        </p>
      </div>

      {/* ARCHETYPES */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Archetypes
              </CardTitle>
              <CardDescription>
                The big name + tagline shown on Results and the dashboard archetype strip.
              </CardDescription>
            </div>
            <Button onClick={saveArchetypes} disabled={savingArchetypes}>
              {savingArchetypes ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save archetypes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="archetype-intro">Intro eyebrow</Label>
            <Input
              id="archetype-intro"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="Based on your answers..."
            />
          </div>

          {archetypes.map((a) => (
            <div key={a.tier} className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {TIER_LABEL[a.tier]}
              </p>
              <div className="space-y-2">
                <Label htmlFor={`arch-name-${a.tier}`}>Name</Label>
                <Input
                  id={`arch-name-${a.tier}`}
                  value={a.name}
                  onChange={(e) => updateArchetype(a.tier, { name: e.target.value })}
                  placeholder="You're an Architect"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`arch-tag-${a.tier}`}>Tagline</Label>
                <Textarea
                  id={`arch-tag-${a.tier}`}
                  value={a.tagline}
                  onChange={(e) => updateArchetype(a.tier, { tagline: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SCORE BANDS + CHAT */}
      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{TIER_LABEL[row.tier] ?? row.tier}</CardTitle>
                <CardDescription>
                  Shown when score is between {row.min_percent}% and {row.max_percent}%.
                </CardDescription>
              </div>
              <Button onClick={() => save(row)} disabled={savingId === row.id}>
                {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`min-${row.id}`}>Min %</Label>
                <Input
                  id={`min-${row.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={row.min_percent}
                  onChange={(e) =>
                    updateRow(row.id, { min_percent: e.target.value === "" ? 0 : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`max-${row.id}`}>Max %</Label>
                <Input
                  id={`max-${row.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={row.max_percent}
                  onChange={(e) =>
                    updateRow(row.id, { max_percent: e.target.value === "" ? 0 : Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`title-${row.id}`}>Title (first chat bubble)</Label>
              <Input
                id={`title-${row.id}`}
                value={row.title}
                onChange={(e) => updateRow(row.id, { title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Chat messages</Label>
              <p className="text-xs text-muted-foreground">
                Each line below appears as its own chat bubble, typed out one after another.
              </p>
              <div className="space-y-2">
                {row.messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Textarea
                      value={msg}
                      onChange={(e) => updateMessage(row.id, i, e.target.value)}
                      rows={2}
                      className="flex-1"
                      placeholder={`Message ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMessage(row.id, i)}
                      aria-label="Remove message"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => addMessage(row.id)}>
                <Plus className="h-4 w-4 mr-1" /> Add message
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminLeadGenQuizResponses;
