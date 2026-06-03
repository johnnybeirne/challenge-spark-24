import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, Circle, Clock, ExternalLink, Pencil, Quote, Target, X } from "lucide-react";

import { useAppState } from "@/context/AppContext";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RestartDay1Button from "@/components/RestartDay1Button";

const readJsonObject = (value: unknown): Record<string, string> => {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const FIELD_LABELS: Record<string, string> = {
  problem: "What problem do you solve?",
  audience: "Who do you solve it for?",
  how: "How do you solve it?",
  topicHint: "Transformation",
  challengeName: "Challenge name",
  challengeTopic: "Challenge topic",
};

const DAY1_OUTPUT_LABELS: Record<string, string> = {
  day1_transformation: "Challenge transformation",
  day1_quick_win: "Quick win idea",
  day1_outcome: "Challenge taker outcome",
  day1_title: "Suggested challenge title",
  day1_structure: "Suggested structure",
};

const DAY2_TASK_LABELS: Record<string, string> = {
  day2_quiz_questions: "Your quiz questions",
};

const DAY3_TASK_LABELS: Record<string, string> = {
  day3_landing_page: "Challenge landing page",
  day3_lead_magnet_quiz: "Lead magnet quiz",
  day3_result_page: "Result page",
  day3_day_content: "Day 1 / 2 / 3 content",
  day3_invite_step: "Invite step",
};

const Section = ({
  eyebrow,
  title,
  description,
  status,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  status?: "complete" | "in_progress" | "locked";
  children: React.ReactNode;
  action?: React.ReactNode;
}) => {
  const StatusIcon =
    status === "complete" ? CheckCircle2 : status === "in_progress" ? Clock : Circle;
  const statusColor =
    status === "complete"
      ? "text-primary"
      : status === "in_progress"
      ? "text-primary"
      : "text-muted-foreground/60";
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary">
            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-xl font-bold leading-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
};

const sentenceCase = (s: string) => {
  const t = (s || "").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border/60 bg-background/60 p-3">
    <p className="text-sm font-semibold text-muted-foreground">
      {sentenceCase(label)}
    </p>
    <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-foreground">{sentenceCase(value)}</p>
  </div>
);

const EmptyDay = ({ day, href }: { day: number; href: string }) => (
  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
    <Button asChild size="sm" variant="outline" className="gap-2">
      <Link to={href}>
        Open Day {day}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  </div>
);


const EditableTitle = ({ identity }: { identity: ReturnType<typeof useChallengeIdentity> }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.topic);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(identity.topic);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, identity.topic]);

  const save = () => {
    identity.setTopic(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(identity.topic);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); save(); }
            if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
          placeholder="Lead Generation"
          className="h-10 text-lg font-bold"
          maxLength={48}
          aria-label="Edit challenge topic"
        />
        <Button type="button" size="icon" variant="default" onClick={save} aria-label="Save title">
          <Check className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={cancel} aria-label="Cancel">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-start gap-2">
      <h3 className="text-2xl font-bold leading-tight text-foreground">{identity.title}</h3>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Edit challenge title"
        title="Edit challenge title"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
};

const ChallengeRecord = () => {
  const { state } = useAppState();
  const identity = useChallengeIdentity();
  const aiOutputs = state.challenge?.aiOutputs ?? {};
  const tasks = state.challenge?.tasks ?? {};
  const currentDay = Math.min(Math.max(state.challenge?.currentDay ?? 1, 1), 3);
  const completed = state.challenge?.completed || state.challenge?.currentDay > 3;

  const day1 = useMemo(() => {
    const foundation = readJsonObject(aiOutputs.day1_foundation);
    const assessment = readJsonObject(aiOutputs.day1_assessment);
    const merged: Record<string, string> = { ...assessment, ...foundation };
    const fields = Object.entries(FIELD_LABELS)
      .map(([k, label]) => ({ label, value: (merged[k] || "").trim() }))
      .filter((f) => f.value);

    const aiCards: { label: string; value: string }[] = [];
    for (const [k, label] of Object.entries(DAY1_OUTPUT_LABELS)) {
      const v = aiOutputs[k];
      if (typeof v === "string" && v.trim()) aiCards.push({ label, value: v });
    }
    const builderKeys = Object.keys(aiOutputs)
      .filter((k) => k.startsWith("day1_builder_"))
      .sort();
    builderKeys.forEach((k, i) => {
      const v = aiOutputs[k];
      if (typeof v === "string" && v.trim()) {
        aiCards.push({ label: `AI Coach note ${i + 1}`, value: v });
      }
    });

    const promise =
      typeof aiOutputs.day1_promise === "string" ? aiOutputs.day1_promise.trim() : "";

    return { fields, aiCards, promise };
  }, [aiOutputs]);

  const day2 = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    for (const [k, label] of Object.entries(DAY2_TASK_LABELS)) {
      const v = aiOutputs[k];
      if (typeof v === "string" && v.trim()) items.push({ label, value: v });
    }
    return items;
  }, [aiOutputs]);

  const day3 = useMemo(() => {
    const items: { label: string; value: string; checked: boolean }[] = [];
    for (const [k, label] of Object.entries(DAY3_TASK_LABELS)) {
      const v = aiOutputs[k];
      const checked = !!tasks[k];
      const value = typeof v === "string" ? v.trim() : "";
      if (checked || value) items.push({ label, value, checked });
    }
    const url = state.challenge?.launchUrl?.trim();
    return { items, url };
  }, [aiOutputs, tasks, state.challenge?.launchUrl]);

  const startedAt = state.challenge?.startedAt ? new Date(state.challenge.startedAt) : null;
  const endsAt = state.challenge?.endsAt ? new Date(state.challenge.endsAt) : null;
  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "—";

  const dayStatus = (n: number): "complete" | "in_progress" | "locked" => {
    if (completed || currentDay > n) return "complete";
    if (currentDay === n) return "in_progress";
    return "locked";
  };

  const dayDate = (n: number): string => {
    const base = startedAt ?? new Date();
    const d = new Date(base);
    d.setDate(d.getDate() + (n - 1));
    return fmt(d);
  };

  const dayEyebrow = (n: number): string => {
    const status =
      dayStatus(n) === "complete"
        ? "Complete"
        : dayStatus(n) === "in_progress"
        ? "In progress"
        : "Locked";
    return `Day ${n} · ${dayDate(n)} · ${status}`;
  };


  return (
    <div className="space-y-5 sm:space-y-6">


      {(identity.isPersonalised || day1.promise) && (
        <section className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-md sm:p-7">
          <Target className="absolute right-4 top-4 h-10 w-10 text-primary/15" />
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            Suggested Challenge Title
          </p>
          <EditableTitle identity={identity} />
        </section>
      )}

      <Section
        eyebrow={dayEyebrow(1)}
        title="Foundation"
        status={dayStatus(1)}
        action={
          (day1.fields.length > 0 || day1.aiCards.length > 0) && (
            <RestartDay1Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs text-muted-foreground"
            />
          )
        }
      >
        {day1.fields.length === 0 && day1.aiCards.length === 0 ? (
          <EmptyDay day={1} href="/challenge/day-1" />
        ) : (
          <div className="space-y-3">
            {day1.fields.map((f) => (
              <Field key={f.label} label={f.label} value={f.value} />
            ))}
            {day1.aiCards.length > 0 && (
              <div className="space-y-2 pt-2">
                {day1.aiCards.map((c, i) => (
                  <div
                    key={`${c.label}-${i}`}
                    className="rounded-lg border border-primary/30 bg-primary/5 p-3"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">
                      {c.label}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {sentenceCase(
                        c.value
                          .replace(/\s*(Day\s*\d+\s*:)/g, (_, m, idx) => (idx === 0 ? m : `\n${m}`))
                          .replace(/(^|[\n.!?:]\s*)([a-z])/g, (_, p, ch) => p + ch.toUpperCase())
                          .trim()
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {currentDay >= 2 && (
        <Section
          eyebrow={dayEyebrow(2)}

          title="Lead Magnet Quiz"
          
          status={dayStatus(2)}
        >
          {day2.length === 0 ? (
            <EmptyDay day={2} href="/challenge/day-2" />
          ) : (
            <div className="space-y-3">
              {day2.map((item) => (
                <Field key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          )}
        </Section>
      )}

      {currentDay >= 3 && (
        <Section
          eyebrow={dayEyebrow(3)}

          title="Launch"
          description="Your launch assets and public challenge URL."
          status={dayStatus(3)}
        >
          {day3.items.length === 0 && !day3.url ? (
            <EmptyDay day={3} href="/challenge/day-3" />
          ) : (
          <div className="space-y-3">
            {day3.url && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">
                  Public challenge URL
                </p>
                <a
                  href={day3.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 break-all text-sm font-semibold text-primary hover:underline"
                >
                  {day3.url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
            {day3.items.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/60 bg-background/60 p-3"
              >
                <div className="flex items-center gap-2">
                  {item.checked ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </p>
                </div>
                {item.value && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        </Section>
      )}
    </div>
  );
};

export default ChallengeRecord;
