import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CopilotConfig {
  id?: string;
  system_prompt: string;
  welcome_message: string;
  starter_questions: string[];
}

const DEFAULTS: CopilotConfig = {
  system_prompt:
    "You are a concise, actionable AI co-pilot for a 3-day trust-leverage challenge. Keep every answer under 300 words. Be direct, practical, and encouraging. Focus on helping the user build, ship, and grow.",
  welcome_message: "Ask Johnny B AI anything about the challenge",
  starter_questions: [],
};

const CmsCopilot = () => {
  const [config, setConfig] = useState<CopilotConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase.from("copilot_config") as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error("Could not load Copilot config");
      } else if (data) {
        setConfig({
          id: data.id,
          system_prompt: data.system_prompt ?? DEFAULTS.system_prompt,
          welcome_message: data.welcome_message ?? DEFAULTS.welcome_message,
          starter_questions: Array.isArray(data.starter_questions)
            ? (data.starter_questions as string[])
            : [],
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const cleanedQuestions = config.starter_questions
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const payload = {
      system_prompt: config.system_prompt.trim(),
      welcome_message: config.welcome_message.trim(),
      starter_questions: cleanedQuestions,
    };

    let error;
    if (config.id) {
      ({ error } = await (supabase.from("copilot_config") as any)
        .update(payload)
        .eq("id", config.id));
    } else {
      const { data, error: insertErr } = await (supabase.from("copilot_config") as any)
        .insert(payload)
        .select()
        .single();
      error = insertErr;
      if (data) setConfig((c) => ({ ...c, id: data.id }));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message ?? "Save failed — admin role required");
    } else {
      toast.success("Johnny B AI config saved");
      setConfig((c) => ({ ...c, starter_questions: cleanedQuestions }));
    }
  };

  const updateQuestion = (i: number, value: string) => {
    setConfig((c) => {
      const next = [...c.starter_questions];
      next[i] = value;
      return { ...c, starter_questions: next };
    });
  };

  const addQuestion = () =>
    setConfig((c) => ({ ...c, starter_questions: [...c.starter_questions, ""] }));

  const removeQuestion = (i: number) =>
    setConfig((c) => ({
      ...c,
      starter_questions: c.starter_questions.filter((_, idx) => idx !== i),
    }));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Johnny B AI (Copilot)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the AI's instructions, welcome message, and quick-tap starter questions. Saves require an admin role.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="welcome">Welcome message</Label>
          <p className="text-xs text-muted-foreground">Shown when the chat is opened with no messages yet. Markdown supported.</p>
          <Textarea
            id="welcome"
            rows={3}
            value={config.welcome_message}
            onChange={(e) => setConfig((c) => ({ ...c, welcome_message: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="prompt">System prompt / persona</Label>
          <p className="text-xs text-muted-foreground">
            Instructions that shape every reply. Keep it focused — tone, role, length limit, what to avoid.
          </p>
          <Textarea
            id="prompt"
            rows={8}
            value={config.system_prompt}
            onChange={(e) => setConfig((c) => ({ ...c, system_prompt: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div>
            <Label>Suggested starter questions</Label>
            <p className="text-xs text-muted-foreground">
              Quick-tap prompts shown in the empty chat state. Up to 6 recommended.
            </p>
          </div>
          {config.starter_questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                placeholder="e.g. What should I do first?"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(i)}
                aria-label="Remove question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add question
          </Button>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save changes
      </Button>
    </div>
  );
};

export default CmsCopilot;
