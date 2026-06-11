import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import {
  DAY1_EXAMPLE_VALUES,
  DAY1_TAG_KEYS,
  Day1StepMessage,
  defaultDay1Steps,
  fetchDay1StepsRemote,
  loadDay1Steps,
  renderDay1Preview,
  saveDay1Steps,
  saveDay1StepsRemote,
} from "@/lib/day1StepMessages";

// -------------------------------------------------------------
// Extra-field schema for each step (options / placeholders / etc.)
// Persisted locally; messages still sync to Supabase via existing API.
// -------------------------------------------------------------

type StepKind =
  | "options"
  | "text-input"
  | "multi-select"
  | "options-with-banner"
  | "text-with-banner"
  | "promise";

interface StepSchema {
  id: string;
  kind: StepKind;
  showContextBanner: boolean;
  contextBanner?: string; // template, supports [audience], [expert_type]
  options?: string[];
  placeholder?: string;
  promiseTemplate?: string;
}

// Defaults mirror the live Day 1 flow in src/components/Day1Setup.tsx:
// - Step 1 buttons match the `audienceOptions` labels.
// - Step 2 banner matches the "You serve: …" recap shown after Step 1.
// - Step 2b options match `EXPERT_TYPE_OPTIONS`.
// - Step 4 options match the `challengeOptions[].description` strings.
// - Step 5/6/7 placeholders match the fallback `*Placeholder` strings.
const DEFAULT_SCHEMAS: Record<string, StepSchema> = {
  "step-1": {
    id: "step-1",
    kind: "options",
    showContextBanner: false,
    options: ["Businesses / Professionals", "Individuals / Consumers"],
  },
  "step-2": {
    id: "step-2",
    kind: "text-input",
    showContextBanner: true,
    contextBanner: "You serve: [audience]",
    placeholder:
      "e.g. Independent coaches and consultants, 0–12 months in, who have expertise but no offer.",
  },
  "step-2b": {
    id: "step-2b",
    kind: "multi-select",
    showContextBanner: true,
    contextBanner: "You serve: [audience]",
    options: ["Coach", "Consultant", "Course creator", "Trainer", "Speaker", "Author"],
  },

  "step-3": {
    id: "step-3",
    kind: "text-with-banner",
    showContextBanner: true,
    contextBanner: "You serve: [audience] · As a [expert_type]",
    placeholder:
      "e.g. I make complex ideas feel simple and actionable, so people finally take the step they've been avoiding.",
  },
  "step-4": {
    id: "step-4",
    kind: "options-with-banner",
    showContextBanner: true,
    contextBanner: "Audience: [audience]",
    options: [
      "Remove a specific blocker",
      "Deliver a meaningful result fast",
      "Build something they keep using",
      "Progress toward an important goal",
    ],
  },
  "step-5": {
    id: "step-5",
    kind: "text-with-banner",
    showContextBanner: true,
    contextBanner: "Audience: [audience]",
    placeholder:
      "e.g. The specific frustration or obstacle holding [audience] back right now.",
  },
  "step-6": {
    id: "step-6",
    kind: "text-with-banner",
    showContextBanner: true,
    contextBanner: "Problem: [problem]",
    placeholder:
      "e.g. Describe the steps or framework you take [audience] through to create the result.",
  },
  "step-7": {
    id: "step-7",
    kind: "text-with-banner",
    showContextBanner: true,
    contextBanner: "Process: [process]",
    placeholder:
      "e.g. The transformation [audience] will experience by the end of the 3 days.",
  },
  "step-8": {
    id: "step-8",
    kind: "promise",
    showContextBanner: true,
    contextBanner: "Audience: [audience] · Outcome: [outcome]",
    promiseTemplate:
      "I help [audience] [outcome] in 3 days using [process].",
  },
};


const SCHEMA_STORAGE_KEY = "admin.day1StepSchemas.v3";

const loadSchemas = (): Record<string, StepSchema> => {
  if (typeof window === "undefined") return DEFAULT_SCHEMAS;
  try {
    const raw = window.localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEMAS;
    const parsed = JSON.parse(raw) as Record<string, Partial<StepSchema>>;
    const merged: Record<string, StepSchema> = { ...DEFAULT_SCHEMAS };
    Object.keys(merged).forEach((id) => {
      if (parsed[id]) merged[id] = { ...merged[id], ...parsed[id] };
    });
    return merged;
  } catch {
    return DEFAULT_SCHEMAS;
  }
};

const saveSchemas = (schemas: Record<string, StepSchema>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schemas));
};

// -------------------------------------------------------------

const AdminDay1Steps = () => {
  const [steps, setSteps] = useState<Day1StepMessage[]>(() => loadDay1Steps());
  const [schemas, setSchemas] = useState<Record<string, StepSchema>>(() => loadSchemas());
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    trackEvent("admin_training_viewed", { surface: "day1_step_editor" });
    let cancelled = false;
    (async () => {
      const remote = await fetchDay1StepsRemote();
      if (cancelled) return;
      if (remote) {
        setSteps(remote);
        saveDay1Steps(remote);
      }
      setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStep = (id: string, message: string) =>
    setSteps((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, message } : s));
      saveDay1Steps(next);
      return next;
    });

  const updateSchema = (id: string, patch: Partial<StepSchema>) =>
    setSchemas((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveSchemas(next);
      return next;
    });

  const updateOption = (id: string, idx: number, value: string) =>
    setSchemas((prev) => {
      const current = prev[id];
      const opts = [...(current.options ?? [])];
      opts[idx] = value;
      const next = { ...prev, [id]: { ...current, options: opts } };
      saveSchemas(next);
      return next;
    });

  const persistRemote = async (next: Day1StepMessage[], successMsg: string) => {
    setSaving(true);
    const { error } = await saveDay1StepsRemote(next);
    setSaving(false);
    if (error) {
      toast.error("Could not sync to the cloud. Local edits still saved.");
      return;
    }
    toast.success(successMsg);
  };

  const handleSave = async () => {
    saveSchemas(schemas);
    await persistRemote(steps, "Day 1 step messages synced to the cloud");
    trackEvent("admin_training_updated", { surface: "day1_step_editor" });
  };

  const handleResetAll = async () => {
    setSteps(defaultDay1Steps);
    setSchemas(DEFAULT_SCHEMAS);
    saveSchemas(DEFAULT_SCHEMAS);
    await persistRemote(defaultDay1Steps, "Reverted to defaults and synced.");
  };

  const handleResetOne = (id: string) => {
    const def = defaultDay1Steps.find((s) => s.id === id);
    if (def) updateStep(id, def.message);
    const defSchema = DEFAULT_SCHEMAS[id];
    if (defSchema) updateSchema(id, defSchema);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Day 1 Step Editor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each step shows a live preview of what the user actually sees, plus editable fields for every
            element on the screen (message, options, placeholder, context banner).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleResetAll} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset all
          </Button>
          <Button onClick={handleSave} disabled={saving || hydrating} className="gap-2">
            <Save className="h-4 w-4" /> {hydrating ? "Loading…" : saving ? "Syncing…" : "Save"}
          </Button>
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Available bracket tags
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY1_TAG_KEYS.map((key) => (
              <Badge key={key} variant="secondary" className="font-mono text-xs">
                [{key}] → {DAY1_EXAMPLE_VALUES[key]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {steps.map((step) => (
          <StepEditorCard
            key={step.id}
            step={step}
            schema={schemas[step.id] ?? { id: step.id, kind: "text-input", showContextBanner: false }}
            onChangeMessage={(msg) => updateStep(step.id, msg)}
            onChangeSchema={(patch) => updateSchema(step.id, patch)}
            onChangeOption={(idx, val) => updateOption(step.id, idx, val)}
            onReset={() => handleResetOne(step.id)}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Syncing…" : "Save all changes"}
        </Button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Preview renderer — mirrors what each step looks like in Day1Setup
// -------------------------------------------------------------

const ContextBanner = ({ template }: { template: string }) => (
  <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
    {renderDay1Preview(template)}
  </div>
);

const StepPreview = ({
  schema,
  message,
}: {
  schema: StepSchema;
  message: string;
}) => {
  const messageRendered = renderDay1Preview(message);
  const promiseRendered = schema.promiseTemplate
    ? renderDay1Preview(schema.promiseTemplate)
    : "";

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
      {schema.showContextBanner && schema.contextBanner && (
        <ContextBanner template={schema.contextBanner} />
      )}

      <div className="whitespace-pre-line text-sm md:text-base leading-relaxed text-foreground/90">
        {messageRendered.trim() || (
          <span className="text-muted-foreground italic">Message preview appears here.</span>
        )}
      </div>

      {(schema.kind === "options" || schema.kind === "options-with-banner") && (
        <div className="flex flex-col gap-2">
          {(schema.options ?? []).map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled
              className="rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-100"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {schema.kind === "multi-select" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(schema.options ?? []).map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled
              className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-100"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(schema.kind === "text-input" || schema.kind === "text-with-banner") && (
        <Textarea
          rows={3}
          disabled
          placeholder={schema.placeholder ?? ""}
          className="text-sm bg-background"
        />
      )}

      {schema.kind === "promise" && (
        <div className="rounded-lg border border-primary/30 bg-background p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your promise
          </p>
          <p className="text-base leading-relaxed text-foreground">
            {promiseRendered || <span className="italic text-muted-foreground">Promise preview.</span>}
          </p>
          <div className="flex gap-2">
            <Button size="sm" disabled className="gap-2">
              <Check className="h-3.5 w-3.5" /> Confirm promise
            </Button>
            <Button size="sm" variant="outline" disabled>
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------

const StepEditorCard = ({
  step,
  schema,
  onChangeMessage,
  onChangeSchema,
  onChangeOption,
  onReset,
}: {
  step: Day1StepMessage;
  schema: StepSchema;
  onChangeMessage: (msg: string) => void;
  onChangeSchema: (patch: Partial<StepSchema>) => void;
  onChangeOption: (idx: number, value: string) => void;
  onReset: () => void;
}) => {
  const id = `day1-step-${step.id}`;
  const preview = useMemo(
    () => <StepPreview schema={schema} message={step.message} />,
    [schema, step.message],
  );

  const hasOptions =
    schema.kind === "options" ||
    schema.kind === "options-with-banner" ||
    schema.kind === "multi-select";

  const hasPlaceholder =
    schema.kind === "text-input" || schema.kind === "text-with-banner";

  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={id} className="text-sm font-semibold">
            {step.label}
          </Label>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 h-7">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        {/* Live preview FIRST */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          {preview}
        </div>

        {/* Editable fields */}
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Message
            </Label>
            <Textarea
              id={id}
              rows={3}
              value={step.message}
              onChange={(e) => onChangeMessage(e.target.value)}
              placeholder="e.g. So [first_name], you work with [audience]…"
              className="font-mono text-sm"
            />
          </div>

          {schema.showContextBanner && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Context banner
              </Label>
              <Input
                value={schema.contextBanner ?? ""}
                onChange={(e) => onChangeSchema({ contextBanner: e.target.value })}
                placeholder="e.g. You work with: [audience]"
                className="font-mono text-sm"
              />
            </div>
          )}

          {hasPlaceholder && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Input placeholder
              </Label>
              <Input
                value={schema.placeholder ?? ""}
                onChange={(e) => onChangeSchema({ placeholder: e.target.value })}
                placeholder="Placeholder text shown in the input"
                className="text-sm"
              />
            </div>
          )}

          {hasOptions && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Option labels
              </Label>
              <div className="space-y-2">
                {(schema.options ?? []).map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={(e) => onChangeOption(i, e.target.value)}
                    className="text-sm"
                  />
                ))}
              </div>
            </div>
          )}

          {schema.kind === "promise" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Promise template
              </Label>
              <Textarea
                rows={2}
                value={schema.promiseTemplate ?? ""}
                onChange={(e) => onChangeSchema({ promiseTemplate: e.target.value })}
                placeholder="e.g. I help [audience] [outcome] in 3 days using [process]."
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDay1Steps;
