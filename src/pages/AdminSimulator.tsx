import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MonitorPlay,
  Shuffle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import {
  SIMULATOR_SCREENS,
  SPEEDS,
  BASE_DWELL_MS,
  buildAnswerPlan,
  getArchetypeInfo,
  randomArchetype,
} from "@/lib/challengeSimulator";
import {
  getQaState,
  setQaState,
  clearQaState,
  type QaArchetype,
  type QaPreviewState,
} from "@/lib/qaPreview";

/** Hours to backdate the demo participant's signup so a given day is live. */
const DAY_OFFSET_HOURS: Record<string, number> = { day1: 0, day2: 26, day3: 50, invites: 50, unlocks: 50 };

const DEMO_CHARACTER = "marcus";

const AdminSimulator = () => {
  const navigate = useNavigate();
  const { questions } = useQuizQuestions();
  const archetypes = useMemo(() => getArchetypeInfo(questions.length), [questions.length]);

  const [archetypeChoice, setArchetypeChoice] = useState<QaArchetype | "random">("random");
  const [targetArchetype, setTargetArchetype] = useState<QaArchetype | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [teardown, setTeardown] = useState(true);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [quizStep, setQuizStep] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const savedQaRef = useRef<QaPreviewState | null>(null);
  const planRef = useRef<number[]>([]);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const screen = SIMULATOR_SCREENS[index];
  const targetInfo = archetypes.find((a) => a.id === targetArchetype) ?? null;

  /* ── demo participant overlay (client-side preview state only) ── */
  const applyDemoState = useCallback(
    (screenId: string, archetype: QaArchetype | null) => {
      const base = getQaState();
      const target = SIMULATOR_SCREENS.find((s) => s.id === screenId);
      const hours = DAY_OFFSET_HOURS[screenId] ?? 0;
      const joinedAt = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      setQaState({
        ...base,
        active: true,
        auth: "logged_in",
        tier: "free",
        entry: "standard_assessment",
        persona: target?.persona ?? null,
        character: DEMO_CHARACTER,
        simulatedJoinedAt: joinedAt,
        archetypeOverride: archetype,
        flags: {
          ...base.flags,
          assessmentCompleted: screenId !== "quiz",
          previewLockedGates: false,
        },
      });
    },
    [],
  );

  const restoreQaState = useCallback(() => {
    if (savedQaRef.current) setQaState(savedQaRef.current);
    else clearQaState();
  }, []);

  useEffect(() => {
    return () => {
      if (teardown) restoreQaState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── navigation ── */
  const goTo = useCallback(
    (nextIndex: number, archetype = targetArchetype) => {
      const clamped = Math.max(0, Math.min(SIMULATOR_SCREENS.length - 1, nextIndex));
      const next = SIMULATOR_SCREENS[clamped];
      applyDemoState(next.id, archetype);
      setIndex(clamped);
      if (iframeRef.current) iframeRef.current.src = next.path;
    },
    [applyDemoState, targetArchetype],
  );

  /* ── quiz autoplay driver ── */
  useEffect(() => {
    if (!running || !playing || screen?.kind !== "quiz") return;
    let cancelled = false;
    const tick = window.setInterval(() => {
      if (cancelled) return;
      const frame = iframeRef.current;
      const doc = frame?.contentDocument;
      if (!doc) return;

      // Quiz finished — the app navigates itself to the result screen.
      const path = frame?.contentWindow?.location?.pathname ?? "";
      if (path.startsWith("/results")) {
        setIndex((i) => (SIMULATOR_SCREENS[i]?.kind === "quiz" ? i + 1 : i));
        applyDemoState("results", targetArchetype);
        return;
      }

      const answerButtons = Array.from(doc.querySelectorAll<HTMLButtonElement>("button")).filter(
        (b) => b.className.includes("rounded-2xl") && b.className.includes("border-2"),
      );

      if (answerButtons.length >= 2) {
        if (answerButtons.every((b) => b.disabled)) return; // mid-transition
        const dots = Array.from(doc.querySelectorAll<HTMLElement>("div.h-1\\.5"));
        const current = Math.max(0, dots.findIndex((d) => d.className.includes("w-8")));
        const choice = planRef.current[current] ?? 0;
        setQuizStep(current + 1);
        answerButtons[choice]?.click();
        return;
      }

      // Still on the landing intro — press the quiz CTA.
      const cta = Array.from(doc.querySelectorAll<HTMLButtonElement>("button")).find((b) =>
        /quiz|start|begin|diagnos/i.test(b.textContent ?? ""),
      );
      cta?.click();
    }, Math.max(80, 260 / speedRef.current));

    return () => {
      cancelled = true;
      window.clearInterval(tick);
    };
  }, [running, playing, screen?.kind, applyDemoState, targetArchetype]);

  /* ── walkthrough auto-advance ── */
  useEffect(() => {
    if (!running || !playing || screen?.kind === "quiz") return;
    if (index >= SIMULATOR_SCREENS.length - 1) return;
    const id = window.setTimeout(() => goTo(index + 1), BASE_DWELL_MS / speed);
    return () => window.clearTimeout(id);
  }, [running, playing, index, screen?.kind, speed, goTo]);

  /* ── controls ── */
  const start = () => {
    savedQaRef.current = getQaState();
    const archetype = archetypeChoice === "random" ? randomArchetype() : archetypeChoice;
    setTargetArchetype(archetype);
    planRef.current = buildAnswerPlan(archetype, questions).plan;
    setQuizStep(0);
    setRunning(true);
    setPlaying(true);
    applyDemoState("quiz", archetype);
    setIndex(0);
    if (iframeRef.current) iframeRef.current.src = SIMULATOR_SCREENS[0].path;
  };

  const reset = () => {
    setRunning(false);
    setPlaying(false);
    setIndex(0);
    setQuizStep(0);
    setTargetArchetype(null);
    if (teardown) restoreQaState();
    if (iframeRef.current) iframeRef.current.src = "about:blank";
  };

  const manual = (delta: number) => {
    setPlaying(false);
    goTo(index + delta);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Challenge simulator</h1>
          <Badge variant="secondary">Demo participant</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Plays the real participant screens in order for a throwaway demo participant. Nothing here writes
          progress or changes real participant data.
        </p>
      </header>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Target archetype</Label>
            <Select
              value={archetypeChoice}
              onValueChange={(v) => setArchetypeChoice(v as QaArchetype | "random")}
              disabled={running}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">
                  <span className="flex items-center gap-2">
                    <Shuffle className="h-3.5 w-3.5" /> Random
                  </span>
                </SelectItem>
                {archetypes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title} ({a.minScore}-{a.maxScore} of {questions.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Speed</Label>
            <div className="flex gap-1">
              {SPEEDS.map((s) => (
                <Button
                  key={s.label}
                  type="button"
                  size="sm"
                  variant={speed === s.value ? "default" : "outline"}
                  onClick={() => setSpeed(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1.5">
            <Switch id="teardown" checked={teardown} onCheckedChange={setTeardown} />
            <Label htmlFor="teardown" className="text-xs">
              Tear down demo state at the end
            </Label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!running ? (
              <Button onClick={start} className="gap-2">
                <Play className="h-4 w-4" /> Play walkthrough
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={() => manual(-1)} aria-label="Previous screen">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button onClick={() => setPlaying((p) => !p)} className="gap-2">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? "Pause" : "Resume"}
                </Button>
                <Button variant="outline" size="icon" onClick={() => manual(1)} aria-label="Next screen">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {running && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Screen {index + 1} of {SIMULATOR_SCREENS.length} — <span className="text-foreground font-medium">{screen?.name}</span>
            </span>
            {targetInfo && <span>Targeting: <span className="text-foreground font-medium">{targetInfo.title}</span></span>}
            {screen?.kind === "quiz" && (
              <span>
                Question {Math.min(quizStep, questions.length)} of {questions.length}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Step rail */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SIMULATOR_SCREENS.map((s, i) => {
          const active = running && i === index;
          const done = running && i < index;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!running}
              onClick={() => manual(i - index)}
              className={cn(
                "min-w-[150px] shrink-0 rounded-xl border p-3 text-left transition-all duration-300",
                active
                  ? "border-primary bg-primary/10 shadow-sm"
                  : done
                    ? "border-border bg-muted/40"
                    : "border-border bg-card",
                !running && "opacity-60",
              )}
            >
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {done ? <Check className="h-3 w-3 text-primary" /> : <span>{i + 1}</span>}
                <span>{s.kind === "quiz" ? "Quiz" : "Screen"}</span>
              </div>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-[11px] text-muted-foreground">{s.note}</div>
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-mono">{running ? screen?.path : "idle"}</span>
          {running && <span>{playing ? "Playing" : "Paused"}</span>}
        </div>
        {running ? (
          <iframe
            key="simulator-stage"
            ref={iframeRef}
            title="Challenge simulator stage"
            className="h-[70vh] w-full animate-fade-in bg-background"
          />
        ) : (
          <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
            <MonitorPlay className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Choose an archetype and press play to watch the full journey.
            </p>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Separate from the QA end to end runner. Use{" "}
        <button className="underline" onClick={() => navigate("/admin/qa-run")}>
          /admin/qa-run
        </button>{" "}
        for pass or fail checks.
      </p>
    </div>
  );
};

export default AdminSimulator;
