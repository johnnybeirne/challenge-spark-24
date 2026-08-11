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
  Maximize2,
  Minimize2,
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
  autoplayQuizTick,
  autoplayFormAnswerTick,
  findFormCta,
  findNavTarget,
} from "@/lib/challengeSimulator";
import {
  getQaState,
  setQaState,
  clearQaState,
  type QaArchetype,
  type QaPreviewState,
} from "@/lib/qaPreview";

const DEMO_CHARACTER = "marcus";


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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [pressed, setPressed] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
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
      setQuizStep(0);
      if (iframeRef.current) iframeRef.current.src = next.path;
    },
    [applyDemoState, targetArchetype],
  );

  /* ── fake cursor: move to a control, press it, then fire the real click ── */
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

  const clickWithCursor = useCallback(async (el: HTMLElement) => {
    const frame = iframeRef.current;
    const stage = stageRef.current;
    if (!frame || !stage) {
      el.click();
      return;
    }
    const s = speedRef.current || 1;
    try {
      el.scrollIntoView({ block: "center" });
    } catch { /* older engines */ }
    await wait(120 / s);

    const r = el.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const st = stage.getBoundingClientRect();
    setCursor({
      x: f.left - st.left + r.left + r.width / 2,
      y: f.top - st.top + r.top + r.height / 2,
      visible: true,
    });
    await wait(Math.max(140, 420 / s)); // travel
    setPressed(true);
    await wait(Math.max(90, 200 / s)); // press
    el.click();
    await wait(Math.max(80, 180 / s)); // ripple settle
    setPressed(false);
  }, []);

  /* ── autoplay driver (shared by the quiz and the Day 1 step-through) ── */
  useEffect(() => {
    if (!running || !playing) return;
    if (screen?.kind !== "quiz" && screen?.kind !== "form") return;
    let cancelled = false;
    const tick = window.setInterval(async () => {
      if (cancelled || busyRef.current) return;
      const frame = iframeRef.current;
      const doc = frame?.contentDocument;
      if (!doc) return;
      const path = frame?.contentWindow?.location?.pathname ?? "";

      if (screen.kind === "quiz") {
        // Quiz finished — the app navigates itself to the result screen.
        if (path.startsWith("/results")) {
          setIndex((i) => (SIMULATOR_SCREENS[i]?.kind === "quiz" ? i + 1 : i));
          applyDemoState("results", targetArchetype);
          return;
        }
        // Answers stay cursor-free and fast.
        const answered = autoplayQuizTick(doc, planRef.current);
        if (answered !== null) setQuizStep(answered + 1);
        return;
      }

      // Day 1 step-through — it finishes by navigating to the dashboard.
      if (!path.startsWith(screen.path)) {
        setIndex((i) => (SIMULATOR_SCREENS[i]?.kind === "form" ? i + 1 : i));
        applyDemoState(SIMULATOR_SCREENS[index + 1]?.id ?? screen.id, targetArchetype);
        return;
      }
      if (autoplayFormAnswerTick(doc)) {
        setQuizStep((s) => s + 1);
        return;
      }
      // Flow buttons get the visible cursor treatment.
      const cta = findFormCta(doc);
      if (cta) {
        busyRef.current = true;
        try {
          await clickWithCursor(cta);
        } finally {
          busyRef.current = false;
        }
      }
    }, Math.max(80, 260 / speedRef.current));

    return () => {
      cancelled = true;
      busyRef.current = false;
      window.clearInterval(tick);
    };
  }, [running, playing, screen?.kind, screen?.path, index, applyDemoState, targetArchetype, clickWithCursor]);

  /* ── mount the stage: the iframe only exists after running flips true ── */
  useEffect(() => {
    if (!running) return;
    const frame = iframeRef.current;
    if (!frame) return;
    const current = frame.getAttribute("src");
    if (!current || current === "about:blank") {
      frame.src = SIMULATOR_SCREENS[index]?.path ?? SIMULATOR_SCREENS[0].path;
    }
  }, [running, index]);

  /* ── walkthrough auto-advance (auto-played screens drive themselves) ── */
  useEffect(() => {
    if (!running || !playing) return;
    if (screen?.kind === "quiz" || screen?.kind === "form") return;
    if (index >= SIMULATOR_SCREENS.length - 1) return;
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const next = SIMULATOR_SCREENS[index + 1];
      const doc = iframeRef.current?.contentDocument;
      const target = doc ? findNavTarget(doc, next.path, next.name) : null;
      if (target) {
        busyRef.current = true;
        try {
          await clickWithCursor(target);
        } finally {
          busyRef.current = false;
        }
      }
      if (!cancelled) goTo(index + 1);
    }, BASE_DWELL_MS / speed);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [running, playing, index, screen?.kind, speed, goTo, clickWithCursor]);



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
    setCursor({ x: 0, y: 0, visible: false });
    setPressed(false);
    busyRef.current = false;
    if (teardown) restoreQaState();
    if (iframeRef.current) iframeRef.current.src = "about:blank";
  };

  const manual = (delta: number) => {
    setPlaying(false);
    goTo(index + delta);
  };

  const compact = running && !detailsOpen;

  return (
    <div className={cn("flex min-h-full flex-col p-4 md:p-6", compact ? "gap-2" : "space-y-4")}>
      {!compact && (
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
      )}

      <Card className={cn(compact ? "px-3 py-2" : "p-4")}>
        <div className={cn("flex flex-wrap items-end gap-4", compact && "items-center gap-2")}>
          {!compact && (
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
          )}

          <div className={cn(compact ? "flex items-center gap-1" : "space-y-1.5")}>
            {!compact && <Label className="text-xs">Speed</Label>}
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

          {!compact && (
            <div className="flex items-center gap-2 pb-1.5">
              <Switch id="teardown" checked={teardown} onCheckedChange={setTeardown} />
              <Label htmlFor="teardown" className="text-xs">
                Tear down demo state at the end
              </Label>
            </div>
          )}

          {compact && (
            <span className="text-xs text-muted-foreground">
              Screen {index + 1} of {SIMULATOR_SCREENS.length} —{" "}
              <span className="font-medium text-foreground">{screen?.name}</span>
              {screen?.kind === "quiz" && (
                <span className="ml-2">
                  Question {Math.min(quizStep, questions.length)} of {questions.length}
                </span>
              )}
            </span>
          )}

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsOpen((d) => !d)}
                  className="gap-2"
                >
                  {detailsOpen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {detailsOpen ? "Hide controls" : "Show controls"}
                </Button>
                <Button variant="ghost" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {running && !compact && (
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
      {!compact && (
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
      )}

      {/* Stage */}
      <Card className={cn("overflow-hidden", compact && "flex min-h-0 flex-1 flex-col")}>
        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <span className="font-mono">{running ? screen?.path : "idle"}</span>
          {running && <span>{playing ? "Playing" : "Paused"}</span>}
        </div>
        {running ? (
          <div
            ref={stageRef}
            className={cn("relative", compact ? "flex min-h-0 flex-1 flex-col" : "")}
          >
            <iframe
              key="simulator-stage"
              ref={iframeRef}
              title="Challenge simulator stage"
              className={cn(
                "w-full animate-fade-in bg-background",
                compact ? "min-h-0 flex-1" : "h-[70vh]",
              )}
            />

            {/* Presentation cursor — overlay only, never takes pointer input */}
            {cursor.visible && playing && (
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 z-20"
                style={{
                  transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
                  transition: `transform ${Math.max(140, 420 / speed)}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
                }}
              >
                <span
                  className="absolute -left-5 -top-5 block h-10 w-10 rounded-full border-2 border-primary/70 bg-primary/20 transition-all duration-200"
                  style={{ opacity: pressed ? 1 : 0, transform: pressed ? "scale(1)" : "scale(0.4)" }}
                />
                <svg
                  viewBox="0 0 24 24"
                  className="relative block h-6 w-6 drop-shadow-md transition-transform duration-150"
                  style={{ transform: pressed ? "scale(0.8)" : "scale(1)" }}
                >
                  <path
                    d="M5 3l13 8-5.5 1.2L15 19l-2.6 1.1-2.6-6.6L5 17V3z"
                    className="fill-background stroke-foreground"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
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
