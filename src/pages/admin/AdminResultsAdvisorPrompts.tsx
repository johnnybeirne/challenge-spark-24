import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";

type Tier = "low" | "mid" | "high";

type Row = {
  id: string;
  tier: Tier;
  prompts: string[];
};

const TIER_ORDER: Tier[] = ["low", "mid", "high"];

const TIER_META: Record<Tier, { label: string; sub: string }> = {
  low: {
    label: "Pioneer (low)",
    sub: "Shown to takers in the lower score band. Speak to first steps and clarity.",
  },
  mid: {
    label: "Architect (mid)",
    sub: "Shown to takers in the middle score band. Speak to structure and repeatable flow.",
  },
  high: {
    label: "Authority (high)",
    sub: "Shown to takers in the upper score band. Speak to leverage and compounding.",
  },
};

const AdminResultsAdvisorPrompts = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [savingTier, setSavingTier] = useState<Tier | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("results_advisor_prompts" as any)
      .select("id,tier,prompts");
    if (error) {
      toast.error("Could not load prompts");
      return;
    }
    const normalised: Row[] = (data ?? []).map((r: any) => ({
      id: r.id,
      tier: r.tier as Tier,
      prompts: Array.isArray(r.prompts)
        ? r.prompts.filter((p: any) => typeof p === "string")
        : [],
    }));
    normalised.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
    setRows(normalised);
  };

  useEffect(() => {
    load();
  }, []);

  const updatePrompt = (tier: Tier, index: number, value: string) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.tier === tier
              ? { ...r, prompts: r.prompts.map((p, i) => (i === index ? value : p)) }
              : r,
          )
        : prev,
    );
  };

  const addPrompt = (tier: Tier) => {
    setRows((prev) =>
      prev
        ? prev.map((r) => (r.tier === tier ? { ...r, prompts: [...r.prompts, ""] } : r))
        : prev,
    );
  };

  const removePrompt = (tier: Tier, index: number) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.tier === tier
              ? { ...r, prompts: r.prompts.filter((_, i) => i !== index) }
              : r,
          )
        : prev,
    );
  };

  const save = async (row: Row) => {
    setSavingTier(row.tier);
    const cleaned = row.prompts.map((p) => p.trim()).filter(Boolean);
    const { error } = await supabase
      .from("results_advisor_prompts" as any)
      .update({ prompts: cleaned })
      .eq("id", row.id);
    setSavingTier(null);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success("Saved");
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === row.id ? { ...r, prompts: cleaned } : r)) : prev,
    );
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
          <Sparkles className="h-6 w-6 text-primary" />
          Results advisor starter prompts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the suggested questions shown to a quiz taker on the Results page,
          grouped by archetype.
        </p>
      </div>

      {rows.map((row) => {
        const meta = TIER_META[row.tier];
        return (
          <Card key={row.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{meta.label}</CardTitle>
                  <CardDescription>{meta.sub}</CardDescription>
                </div>
                <Button onClick={() => save(row)} disabled={savingTier === row.tier}>
                  {savingTier === row.tier ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Starter prompts</Label>
                <p className="text-xs text-muted-foreground">
                  Each prompt appears as a suggested question chip on the Results
                  page advisor.
                </p>
                <div className="space-y-2">
                  {row.prompts.map((prompt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Textarea
                        value={prompt}
                        onChange={(e) => updatePrompt(row.tier, i, e.target.value)}
                        rows={2}
                        className="flex-1"
                        placeholder={`Prompt ${i + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrompt(row.tier, i)}
                        aria-label="Remove prompt"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPrompt(row.tier)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminResultsAdvisorPrompts;
