import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useAppState } from "@/context/AppContext";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import { challengeTypeLabel } from "@/lib/personalisation";
import { formatExpertTypes } from "@/components/Day1Setup";
import {
  DAY1_EXAMPLE_VALUES,
  DAY1_TAG_KEYS,
  Day1StepMessage,
  Day1TagKey,
  defaultDay1Steps,
  fetchDay1StepsRemote,
  loadDay1Steps,
  renderDay1Preview,
  saveDay1Steps,
  saveDay1StepsRemote,
} from "@/lib/day1StepMessages";

// -------------------------------------------------------------
// Step schema (banner / options / placeholder / promise)
// Mirrors src/components/Day1Setup.tsx exactly.
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
  contextBanner?: string;
  options?: string[];
  placeholder?: string;
  promiseTemplate?: string;
  /** 3 short example hints shown beneath the input — text-input steps only. */
  examples?: [string, string, string];
}

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
    examples: [
      "e.g. New parents in their 30s",
      "e.g. Women returning to work after a career break",
      "e.g. First-time homebuyers",
    ],
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
    examples: [
      "e.g. I simplify complex ideas into clear next steps.",
      "e.g. I help people get unstuck quickly.",
      "e.g. I turn vague goals into concrete plans.",
    ],
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
    examples: [
      "e.g. They feel overwhelmed and don't know where to start.",
      "e.g. They've tried before and lost momentum.",
      "e.g. They can't see a clear path forward.",
    ],
  },
  "step-6": {
    id: "step-6",
    kind: "text-with-banner",
    showContextBanner: true,
    contextBanner: "Problem: [problem]",
    placeholder:
      "e.g. Describe the steps or framework you take [audience] through to create the result.",
    examples: [
      "e.g. A simple 3-step framework anyone can follow.",
      "e.g. Daily check-ins plus one focused action.",
      "e.g. A guided walkthrough with clear milestones.",
    ],
  },
  "step-7": {
    id: "step-7",
    kind: "text-with-banner",
    showContextBanner: true,
    contextBanner: "Process: [process]",
    placeholder:
      "e.g. The transformation [audience] will experience by the end of the 3 days.",
    examples: [
      "e.g. They have a clear plan they can act on today.",
      "e.g. They've made visible progress they can point to.",
      "e.g. They feel confident moving forward on their own.",
    ],
  },
  "step-8": {
    id: "step-8",
    kind: "promise",
    showContextBanner: true,
    contextBanner: "Audience: [audience] · Outcome: [outcome]",
    promiseTemplate:
      "I help [audience] [outcome] in 3 days using [process].",
    examples: [
      "e.g. I help new parents build a calm bedtime routine in 3 days.",
      "e.g. I help career returners land their first interview in 3 days.",
      "e.g. I help first-time buyers understand their mortgage options in 3 days.",
    ],
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
// Hydrate bracket-tag values from real signed-in user state.
// Falls back to example values only when the field is empty.
// -------------------------------------------------------------

const useLiveTagValues = (): Record<Day1TagKey, string> => {
  const { state } = useAppState();
  const identity = useChallengeIdentity();

  const setup: any = (state.challenge?.aiOutputs as any)?.day1Setup ?? {};
  const promiseRaw = (state.challenge?.aiOutputs as any)?.day1_promise;

  // Stable signature so the memo recomputes the moment any upstream tag value
  // changes (e.g. Step 2 sets audience → Step 3 preview reflects it instantly).
  const sig = JSON.stringify({
    name: state.user?.name ?? "",
    setup,
    promiseRaw,
    audience: identity.audience,
    problem: identity.problem,
    method: identity.method,
  });

  return useMemo(() => {
    const firstName = (state.user?.name || "").trim().split(/\s+/)[0] || "";
    const audience = String(setup.audience || identity.audience || "").trim();
    const expertType = formatExpertTypes(setup.expertType);
    const superpower = String(setup.superpower || "").trim();
    const challengeTypeRaw = String(setup.challengeType || "").trim();
    const challengeType = challengeTypeRaw ? challengeTypeLabel(challengeTypeRaw) : "";
    const problem = String(setup.problem || identity.problem || "").trim();
    const processV = String(setup.how || identity.method || "").trim();
    const outcome = String(setup.outcome || "").trim();

    let promise = "";
    try {
      if (promiseRaw) {
        const parsed = typeof promiseRaw === "string" ? JSON.parse(promiseRaw) : promiseRaw;
        promise = String(parsed?.promise || "").trim();
      }
    } catch {
      /* noop */
    }

    const live: Record<Day1TagKey, string> = {
      first_name: firstName,
      audience,
      expert_type: expertType,
      superpower,
      challenge_type: challengeType,
      problem,
      process: processV,
      outcome,
      promise,
    };

    const merged = { ...DAY1_EXAMPLE_VALUES };
    (Object.keys(live) as Day1TagKey[]).forEach((k) => {
      if (live[k]) merged[k] = live[k];
    });
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
};

// -------------------------------------------------------------
// Live preview — styled to mirror the Day 1 chat experience.
// -------------------------------------------------------------

const LivePreview = ({
  step,
  schema,
  values,
}: {
  step: Day1StepMessage;
  schema: StepSchema;
  values: Record<Day1TagKey, string>;
}) => {
  const message = renderDay1Preview(step.message, values);
  const banner = schema.contextBanner ? renderDay1Preview(schema.contextBanner, values) : "";
  const placeholder = schema.placeholder ? renderDay1Preview(schema.placeholder, values) : "";
  const promise = schema.promiseTemplate ? renderDay1Preview(schema.promiseTemplate, values) : "";
  const examples = (schema.examples ?? []).map((ex) => renderDay1Preview(ex || "", values)).filter(Boolean);
  const isTextInput =
    schema.kind === "text-input" || schema.kind === "text-with-banner" || schema.kind === "promise";

  return (
    <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
        <span>Live preview</span>
        <span className="text-[10px] font-normal normal-case tracking-normal">
          {step.label}
        </span>
      </div>

      <div className="p-5 space-y-4 min-h-[420px]">
        {schema.showContextBanner && banner && (
          <div className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            {banner}
          </div>
        )}

        {/* Coach bubble */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
            J
          </div>
          <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-line">
            {message.trim() || (
              <span className="italic text-muted-foreground">Message preview appears here.</span>
            )}
          </div>
        </div>

        {/* Response area */}
        <div className="pl-11 space-y-3">
          {(schema.kind === "options" || schema.kind === "options-with-banner") && (
            <div className="flex flex-col gap-2">
              {(schema.options ?? []).map((opt, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors"
                >
                  {opt}
                </div>
              ))}
            </div>
          )}

          {schema.kind === "multi-select" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(schema.options ?? []).map((opt, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-center text-foreground/80"
                >
                  {opt}
                </div>
              ))}
            </div>
          )}

          {(schema.kind === "text-input" || schema.kind === "text-with-banner") && (
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm italic text-muted-foreground min-h-[64px]">
              {placeholder || "Type your answer…"}
            </div>
          )}

          {schema.kind === "promise" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                Your promise
              </p>
              <p className="text-base leading-relaxed text-foreground">
                {promise || <span className="italic text-muted-foreground">Promise preview.</span>}
              </p>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  <Check className="h-3 w-3" /> Confirm promise
                </span>
                <span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  Edit
                </span>
              </div>
            </div>
          )}

          {isTextInput && examples.length > 0 && (
            <ul className="text-xs text-muted-foreground leading-snug list-disc pl-5 space-y-0.5">
              {examples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------

const AdminDay1Steps = () => {
  const [steps, setSteps] = useState<Day1StepMessage[]>(() => loadDay1Steps());
  const [schemas, setSchemas] = useState<Record<string, StepSchema>>(() => loadSchemas());
  const [activeId, setActiveId] = useState<string>(() => loadDay1Steps()[0]?.id ?? "step-1");
  const [saving, setSaving] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);

  // Track which editable field has focus so chip clicks insert at the cursor.
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const bannerRef = useRef<HTMLTextAreaElement | null>(null);
  const placeholderRef = useRef<HTMLTextAreaElement | null>(null);
  const promiseRef = useRef<HTMLTextAreaElement | null>(null);
  const optionRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const [focusedField, setFocusedField] = useState<
    | { kind: "message" }
    | { kind: "banner" }
    | { kind: "placeholder" }
    | { kind: "promise" }
    | { kind: "option"; index: number }
  >({ kind: "message" });

  const liveValues = useLiveTagValues();

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

  const activeStep = steps.find((s) => s.id === activeId) ?? steps[0];
  const activeSchema =
    schemas[activeStep?.id] ?? { id: activeStep?.id ?? "", kind: "text-input", showContextBanner: false };

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

  const handleSaveStep = async () => {
    if (!activeStep) return;
    setSaving(activeStep.id);
    saveSchemas(schemas);
    const { error } = await saveDay1StepsRemote(steps);
    setSaving(null);
    if (error) {
      toast.error("Could not sync. Local edits still saved.");
      return;
    }
    toast.success(`${activeStep.label} saved`);
    trackEvent("admin_training_updated", { surface: "day1_step_editor" });
  };

  // Always-current refs so any save reads the latest in-memory values,
  // never a stale closure that could overwrite newer edits.
  const stepsRef = useRef(steps);
  const schemasRef = useRef(schemas);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  useEffect(() => {
    schemasRef.current = schemas;
  }, [schemas]);

  // Monotonic counter so an older in-flight remote save can never clobber
  // a newer one (we ignore any response whose token is not the latest).
  const saveTokenRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const flushSaveNow = () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const token = ++saveTokenRef.current;
    const latestSteps = stepsRef.current;
    const latestSchemas = schemasRef.current;
    try {
      saveSchemas(latestSchemas);
      saveDay1Steps(latestSteps);
    } catch {
      /* localStorage failure is non-fatal */
    }
    void saveDay1StepsRemote(latestSteps).catch(() => {
      /* silent — local copy is already written */
    }).finally(() => {
      // No-op: token guard prevents stale overwrites; nothing to roll back here
      // because saveDay1StepsRemote does not return data we apply to state.
      if (token !== saveTokenRef.current) {
        /* a newer save has superseded this one — ignore */
      }
    });
  };

  // Debounced auto-save: only fires 800ms after the user stops typing.
  useEffect(() => {
    if (hydrating) return;
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      flushSaveNow();
    }, 800);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [steps, schemas, hydrating]);

  const handleSelectStep = (nextId: string) => {
    if (nextId === activeId) return;
    // Flush any pending debounced save immediately with the LATEST values,
    // then switch — never block navigation on the network round-trip.
    flushSaveNow();
    setActiveId(nextId);
  };

  const handleResetStep = () => {
    if (!activeStep) return;
    const def = defaultDay1Steps.find((s) => s.id === activeStep.id);
    if (def) updateStep(activeStep.id, def.message);
    const defSchema = DEFAULT_SCHEMAS[activeStep.id];
    if (defSchema) updateSchema(activeStep.id, defSchema);
  };

  // -- Tag insertion at cursor ------------------------------------------------
  const insertAtCursor = <T extends HTMLInputElement | HTMLTextAreaElement>(
    el: T | null,
    current: string,
    insert: string,
    commit: (next: string) => void,
  ) => {
    if (!el) {
      commit(current + insert);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + insert + current.slice(end);
    commit(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* noop */
      }
    });
  };

  const insertTag = (tag: Day1TagKey) => {
    if (!activeStep) return;
    const token = `[${tag}]`;
    switch (focusedField.kind) {
      case "message":
        insertAtCursor(messageRef.current, activeStep.message, token, (next) =>
          updateStep(activeStep.id, next),
        );
        break;
      case "banner":
        insertAtCursor(bannerRef.current, activeSchema.contextBanner ?? "", token, (next) =>
          updateSchema(activeStep.id, { contextBanner: next }),
        );
        break;
      case "placeholder":
        insertAtCursor(placeholderRef.current, activeSchema.placeholder ?? "", token, (next) =>
          updateSchema(activeStep.id, { placeholder: next }),
        );
        break;
      case "promise":
        insertAtCursor(promiseRef.current, activeSchema.promiseTemplate ?? "", token, (next) =>
          updateSchema(activeStep.id, { promiseTemplate: next }),
        );
        break;
      case "option": {
        const idx = focusedField.index;
        const opts = activeSchema.options ?? [];
        const current = opts[idx] ?? "";
        insertAtCursor(optionRefs.current[idx] ?? null, current, token, (next) =>
          updateOption(activeStep.id, idx, next),
        );
        break;
      }
    }
  };

  const hasOptions =
    activeSchema.kind === "options" ||
    activeSchema.kind === "options-with-banner" ||
    activeSchema.kind === "multi-select";
  const hasPlaceholder =
    activeSchema.kind === "text-input" || activeSchema.kind === "text-with-banner";
  const hasExamples =
    activeSchema.kind === "text-input" ||
    activeSchema.kind === "text-with-banner" ||
    activeSchema.kind === "promise";
  const activeExamples: [string, string, string] = [
    activeSchema.examples?.[0] ?? "",
    activeSchema.examples?.[1] ?? "",
    activeSchema.examples?.[2] ?? "",
  ];
  const updateExample = (idx: 0 | 1 | 2, value: string) => {
    const next: [string, string, string] = [...activeExamples] as [string, string, string];
    next[idx] = value;
    updateSchema(activeStep!.id, { examples: next });
  };

  if (!activeStep) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Day 1 Step Editor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit any of the 9 onboarding steps. The right column shows exactly what the user sees, hydrated with your real Day 1 answers.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — editor */}
        <div className="space-y-5">
          {/* Step selector */}
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Steps
              </p>
              <ol className="flex flex-wrap gap-1.5">
                {steps.map((s, i) => {
                  const active = s.id === activeId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectStep(s.id)}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground/70 hover:bg-accent"
                        }`}
                        title={s.label}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                            active ? "bg-primary-foreground/20" : "bg-background"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate max-w-[140px]">
                          {s.label.replace(/^Step \d+ of \d+ — /, "")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Tag chips */}
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Insert tag at cursor
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DAY1_TAG_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // keep focus on the input
                    onClick={() => insertTag(key)}
                    className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground/80 hover:bg-accent transition-colors"
                    title={`Inserts [${key}] — live value: ${liveValues[key] || "(empty)"}`}
                  >
                    [{key}]
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Click a chip to insert it at the cursor in whichever field you last focused.
              </p>
            </CardContent>
          </Card>

          {/* Editable fields for active step */}
          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-semibold">{activeStep.label}</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleResetStep} className="gap-2 h-8">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveStep}
                    disabled={saving === activeStep.id || hydrating}
                    className="gap-2 h-8"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving === activeStep.id ? "Saving…" : "Save step"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </Label>
                <Textarea
                  ref={messageRef}
                  rows={4}
                  value={activeStep.message}
                  onFocus={() => setFocusedField({ kind: "message" })}
                  onChange={(e) => updateStep(activeStep.id, e.target.value)}
                  placeholder="e.g. So [first_name], you work with [audience]…"
                  className="text-sm"
                />
              </div>

              {activeSchema.showContextBanner && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Context banner
                  </Label>
                  <Textarea
                    ref={bannerRef}
                    rows={2}
                    value={activeSchema.contextBanner ?? ""}
                    onFocus={() => setFocusedField({ kind: "banner" })}
                    onChange={(e) => updateSchema(activeStep.id, { contextBanner: e.target.value })}
                    placeholder="e.g. You work with: [audience]"
                    className="text-sm resize-y"
                  />
                </div>
              )}

              {hasPlaceholder && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Input placeholder
                  </Label>
                  <Textarea
                    ref={placeholderRef}
                    rows={2}
                    value={activeSchema.placeholder ?? ""}
                    onFocus={() => setFocusedField({ kind: "placeholder" })}
                    onChange={(e) => updateSchema(activeStep.id, { placeholder: e.target.value })}
                    placeholder="Placeholder text shown in the input"
                    className="text-sm resize-y"
                  />
                </div>
              )}

              {hasOptions && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Option labels
                  </Label>
                  <div className="space-y-2">
                    {(activeSchema.options ?? []).map((opt, i) => (
                      <Textarea
                        key={i}
                        ref={(el) => {
                          optionRefs.current[i] = el;
                        }}
                        rows={2}
                        value={opt}
                        onFocus={() => setFocusedField({ kind: "option", index: i })}
                        onChange={(e) => updateOption(activeStep.id, i, e.target.value)}
                        className="text-sm resize-y"
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeSchema.kind === "promise" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Promise template
                  </Label>
                  <Textarea
                    ref={promiseRef}
                    rows={2}
                    value={activeSchema.promiseTemplate ?? ""}
                    onFocus={() => setFocusedField({ kind: "promise" })}
                    onChange={(e) =>
                      updateSchema(activeStep.id, { promiseTemplate: e.target.value })
                    }
                    placeholder="e.g. I help [audience] [outcome] in 3 days using [process]."
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <LivePreview step={activeStep} schema={activeSchema} values={liveValues} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DAY1_TAG_KEYS.map((k) => (
              <Badge
                key={k}
                variant={liveValues[k] && liveValues[k] !== DAY1_EXAMPLE_VALUES[k] ? "default" : "secondary"}
                className="font-mono text-[10px]"
                title={liveValues[k] || "(empty — using example)"}
              >
                [{k}]
                {liveValues[k] && liveValues[k] !== DAY1_EXAMPLE_VALUES[k] ? " ✓" : " · sample"}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tags marked ✓ are pulling your real Day 1 answers. Empty fields fall back to sample values so the preview always renders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDay1Steps;
