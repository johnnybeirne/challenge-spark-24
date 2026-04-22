import { useEffect, useState } from "react";
import { formatQaDateAdmin, getLocalTimeValue, QA_TIMEZONE } from "@/lib/qaDate";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface CopilotConfig {
  id?: string;
  welcome_message: string;
  fallback_message: string;
  starter_questions: string[];
  next_qa_date: string | null;
}

interface QaRow {
  id?: string;
  question: string;
  answer: string;
  keywords: string; // comma-separated for editing
  sort_order: number;
  is_active: boolean;
  _dirty?: boolean;
  _new?: boolean;
}

const DEFAULTS: CopilotConfig = {
  welcome_message: "Ask Johnny B AI anything about the challenge",
  fallback_message:
    "I don't have an answer for that yet. Try one of the suggested questions below.",
  starter_questions: [],
  next_qa_date: null,
};

const CmsCopilot = () => {
  const [config, setConfig] = useState<CopilotConfig>(DEFAULTS);
  const [qa, setQa] = useState<QaRow[]>([]);
  const [deletedQaIds, setDeletedQaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [cfgRes, qaRes] = await Promise.all([
        (supabase.from("copilot_config") as any)
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase.from("copilot_qa") as any)
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

      if (cfgRes.error) toast.error("Could not load Copilot config");
      else if (cfgRes.data) {
        setConfig({
          id: cfgRes.data.id,
          welcome_message: cfgRes.data.welcome_message ?? DEFAULTS.welcome_message,
          fallback_message: cfgRes.data.fallback_message ?? DEFAULTS.fallback_message,
          starter_questions: Array.isArray(cfgRes.data.starter_questions)
            ? (cfgRes.data.starter_questions as string[])
            : [],
          next_qa_date: cfgRes.data.next_qa_date ?? null,
        });
      }

      if (qaRes.error) toast.error("Could not load Q&A library");
      else if (qaRes.data) {
        setQa(
          (qaRes.data as any[]).map((r) => ({
            id: r.id,
            question: r.question,
            answer: r.answer,
            keywords: Array.isArray(r.keywords) ? r.keywords.join(", ") : "",
            sort_order: r.sort_order ?? 0,
            is_active: r.is_active ?? true,
          }))
        );
      }

      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);

    const cleanedQuestions = config.starter_questions
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const cfgPayload = {
      welcome_message: config.welcome_message.trim(),
      fallback_message: config.fallback_message.trim(),
      starter_questions: cleanedQuestions,
      next_qa_date: config.next_qa_date,
    };

    let cfgError: any;
    if (config.id) {
      ({ error: cfgError } = await (supabase.from("copilot_config") as any)
        .update(cfgPayload)
        .eq("id", config.id));
    } else {
      const { data, error } = await (supabase.from("copilot_config") as any)
        .insert(cfgPayload)
        .select()
        .single();
      cfgError = error;
      if (data) setConfig((c) => ({ ...c, id: data.id }));
    }

    // Delete removed Q&A rows
    if (deletedQaIds.length > 0) {
      const { error } = await (supabase.from("copilot_qa") as any)
        .delete()
        .in("id", deletedQaIds);
      if (error) toast.error("Failed to delete some Q&A entries");
    }

    // Upsert Q&A rows
    let qaError: any = null;
    const updatedQa: QaRow[] = [];
    for (let i = 0; i < qa.length; i++) {
      const row = qa[i];
      const payload = {
        question: row.question.trim(),
        answer: row.answer.trim(),
        keywords: row.keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
        sort_order: i,
        is_active: row.is_active,
      };
      if (!payload.question || !payload.answer) {
        updatedQa.push(row);
        continue;
      }
      if (row.id) {
        const { error } = await (supabase.from("copilot_qa") as any)
          .update(payload)
          .eq("id", row.id);
        if (error) qaError = error;
        updatedQa.push({ ...row, sort_order: i });
      } else {
        const { data, error } = await (supabase.from("copilot_qa") as any)
          .insert(payload)
          .select()
          .single();
        if (error) qaError = error;
        if (data) updatedQa.push({ ...row, id: data.id, sort_order: i });
        else updatedQa.push(row);
      }
    }

    setSaving(false);
    setDeletedQaIds([]);
    setQa(updatedQa);
    setConfig((c) => ({ ...c, starter_questions: cleanedQuestions }));

    if (cfgError || qaError) {
      toast.error(
        (cfgError ?? qaError)?.message ?? "Save failed — admin role required"
      );
    } else {
      toast.success("Johnny B AI config saved");
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

  const updateQa = (i: number, patch: Partial<QaRow>) => {
    setQa((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addQaRow = () =>
    setQa((prev) => [
      ...prev,
      {
        question: "",
        answer: "",
        keywords: "",
        sort_order: prev.length,
        is_active: true,
        _new: true,
      },
    ]);

  const removeQaRow = (i: number) => {
    setQa((prev) => {
      const row = prev[i];
      if (row.id) setDeletedQaIds((d) => [...d, row.id!]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

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
          The chat now answers <strong>only</strong> from the Q&A library below — it no
          longer queries an AI model. Add the questions you expect users to ask and the
          exact answers to return.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label>Next Live Group Q&amp;A date</Label>
          <p className="text-xs text-muted-foreground">
            Shown in the landing-page banner. Leave blank to display "[Date TBC]".
          </p>
          <div className="flex gap-2 items-center pt-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !config.next_qa_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {config.next_qa_date
                    ? formatQaDateAdmin(config.next_qa_date)
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={config.next_qa_date ? new Date(config.next_qa_date) : undefined}
                  onSelect={(d) => {
                    if (!d) return;
                    const existing = config.next_qa_date ? new Date(config.next_qa_date) : null;
                    const next = new Date(d);
                    next.setHours(existing?.getHours() ?? 19, existing?.getMinutes() ?? 0, 0, 0);
                    setConfig((c) => ({ ...c, next_qa_date: next.toISOString() }));
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              className="w-32"
              value={
                config.next_qa_date
                  ? getLocalTimeValue(config.next_qa_date)
                  : ""
              }
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                if (Number.isNaN(h) || Number.isNaN(m)) return;
                const base = config.next_qa_date ? new Date(config.next_qa_date) : new Date();
                base.setHours(h, m, 0, 0);
                setConfig((c) => ({ ...c, next_qa_date: base.toISOString() }));
              }}
            />
            {config.next_qa_date && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfig((c) => ({ ...c, next_qa_date: null }))}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="welcome">Welcome message</Label>
          <p className="text-xs text-muted-foreground">
            Shown when the chat is opened with no messages yet. Markdown supported.
          </p>
          <Textarea
            id="welcome"
            rows={3}
            value={config.welcome_message}
            onChange={(e) =>
              setConfig((c) => ({ ...c, welcome_message: e.target.value }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="fallback">Fallback message (no match)</Label>
          <p className="text-xs text-muted-foreground">
            Returned when the user's question doesn't match any Q&A entry.
          </p>
          <Textarea
            id="fallback"
            rows={3}
            value={config.fallback_message}
            onChange={(e) =>
              setConfig((c) => ({ ...c, fallback_message: e.target.value }))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div>
            <Label>Suggested starter questions</Label>
            <p className="text-xs text-muted-foreground">
              Quick-tap prompts shown in the empty chat state. Tip: each starter should
              have a matching entry in the Q&A library.
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

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label>Q&A library</Label>
            <p className="text-xs text-muted-foreground">
              Each entry: a question, the exact answer to return, and optional keywords
              (comma-separated) to broaden matching. Matching is exact-question first,
              then keyword overlap.
            </p>
          </div>
          {qa.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No entries yet. Add one below.
            </p>
          )}
          {qa.map((row, i) => (
            <div
              key={row.id ?? `new-${i}`}
              className="space-y-2 border border-border rounded-md p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Question (e.g. What is Day 1?)"
                    value={row.question}
                    onChange={(e) => updateQa(i, { question: e.target.value })}
                  />
                  <Textarea
                    placeholder="Answer to return verbatim. Markdown supported."
                    rows={4}
                    value={row.answer}
                    onChange={(e) => updateQa(i, { answer: e.target.value })}
                  />
                  <Input
                    placeholder="Keywords (comma-separated, optional) — e.g. day 1, first day, start"
                    value={row.keywords}
                    onChange={(e) => updateQa(i, { keywords: e.target.value })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQaRow(i)}
                  aria-label="Remove Q&A entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addQaRow} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add Q&A entry
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
