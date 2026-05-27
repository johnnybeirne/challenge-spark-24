import { useEffect, useRef, useState } from "react";
import { Briefcase, User as UserIcon, Zap, Sparkles, GraduationCap, Rocket, ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { useAppState } from "@/context/AppContext";
import { mergeMemory, normalizeChallengeType, copilotMemoryContext } from "@/lib/personalisation";
import DictateButton from "@/components/DictateButton";
import { useDictation } from "@/hooks/useDictation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import RestartDay1Button from "@/components/RestartDay1Button";

export const SETUP_KEY = "leadio_setup";
const DAY1_STEP_KEY = "leadio_day1_step";

export interface SetupData {
  completed: boolean;
  audienceType: "b2b" | "b2c";
  challengeType: string;
  topicHint: string;
  desiredOutcome?: string;
}

export const getSetup = (): SetupData | null => {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.completed ? parsed : null;
  } catch {
    return null;
  }
};

interface Props {
  onComplete: (data: SetupData) => void;
}

// 1-4 = In-Challenge Assessment, 5 = AI-Guided Challenge Builder
type Step = 1 | 2 | 3 | 4 | 5;

const audienceOptions = [
  { value: "b2b" as const, label: "Businesses / professionals", icon: Briefcase },
  { value: "b2c" as const, label: "Individuals / consumers", icon: UserIcon },
];

const challengeOptions = [
  { value: "quick-win", label: "A quick win", icon: Zap },
  { value: "transformation", label: "A transformation", icon: Sparkles },
  { value: "skill", label: "Learn a skill", icon: GraduationCap },
  { value: "launch", label: "Launch something", icon: Rocket },
];

const challengeLabel = (v: string) =>
  challengeOptions.find((o) => o.value === v)?.label.toLowerCase().replace(/^a /, "") ?? v;

const audienceLabel = (v: "b2b" | "b2c") =>
  v === "b2b" ? "businesses" : "consumers";

interface ChatEntry {
  prompt: string;
  response: string;
}

const BUILDER_STARTERS = [
  "Sharpen the promise of my challenge into one clear sentence.",
  "Suggest a 3-day structure that delivers the transformation.",
  "What hook will make my audience want to start this challenge?",
  "Give me 3 ways to make the result feel tangible by Day 3.",
];

const Day1Setup = ({ onComplete }: Props) => {
  const { state, setState } = useAppState();

  // Restore prior in-progress assessment from saved setup + persisted step
  const saved = (() => { try { return JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); } catch { return null; } })();
  const persistedStep = (() => { try { return Number(localStorage.getItem(DAY1_STEP_KEY)) as Step; } catch { return 1 as Step; } })();
  const initialStep: Step = (persistedStep >= 1 && persistedStep <= 5 ? persistedStep : (saved?.audienceType ? 5 : 1)) as Step;

  const [step, setStep] = useState<Step>(initialStep);
  const [audienceType, setAudienceType] = useState<"b2b" | "b2c" | null>(saved?.audienceType ?? null);
  const [challengeType, setChallengeType] = useState<string>(saved?.challengeType ?? "");
  const [topicHint, setTopicHint] = useState<string>(saved?.topicHint ?? "");
  const { isListening: isDictating, toggle: toggleDictation } = useDictation();

  // AI builder state
  const [builderInput, setBuilderInput] = useState("");
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderHistory, setBuilderHistory] = useState<ChatEntry[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    trackEvent("onboarding_viewed", { step });
    try { localStorage.setItem(DAY1_STEP_KEY, String(step)); } catch {}
  }, [step]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [builderHistory, builderLoading]);

  const advance = (next: Step) => setTimeout(() => setStep(next), 250);

  const handleAudience = (v: "b2b" | "b2c") => { setAudienceType(v); advance(2); };
  const handleChallenge = (v: string) => { setChallengeType(v); advance(3); };
  const handleTopicNext = () => setStep(4);
  const goBack = () => setStep(Math.max(1, (step as number) - 1) as Step);

  // STEP 1 COMPLETE → save the assessment, persist to memory + aiOutputs,
  // and advance to the AI-guided builder (Step 2 of Day 1).
  const handleSaveAssessment = () => {
    if (!audienceType || !challengeType) return;
    const data: SetupData = {
      completed: true,
      audienceType,
      challengeType,
      topicHint: topicHint.trim(),
      desiredOutcome: topicHint.trim(),
    };
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(data)); } catch {}

    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, {
        name: prev.user?.name || prev.memory.name,
        audienceType,
        challengeType: normalizeChallengeType(challengeType),
        desiredOutcome: topicHint,
        topic: topicHint,
      }),
      challenge: {
        ...prev.challenge,
        // Persist assessment answers so Day 1 reads "In Progress" everywhere.
        aiOutputs: {
          ...prev.challenge.aiOutputs,
          day1_assessment: JSON.stringify({
            audienceType,
            challengeType,
            transformation: topicHint,
          }),
        },
      },
    }));

    trackEvent("onboarding_invite_completed", { audienceType, challengeType });
    trackEvent("memory_created", { source: "day1_assessment" });
    setStep(5);
  };

  // STEP 2 COMPLETE → finalise Day 1 (Training.tsx bumps currentDay to 2 + marks day1Watched)
  const handleFinishDay1 = () => {
    if (!audienceType || !challengeType) return;
    const data: SetupData = {
      completed: true,
      audienceType,
      challengeType,
      topicHint: topicHint.trim(),
      desiredOutcome: topicHint.trim(),
    };
    try { localStorage.removeItem(DAY1_STEP_KEY); } catch {}
    trackEvent("day_completed", { day: 1 });
    onComplete(data);
  };

  const askBuilder = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? builderInput).trim();
    if (!prompt || builderLoading) return;
    setBuilderLoading(true);
    setBuilderInput("");
    try {
      const memoryContext = copilotMemoryContext(state.memory);
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: { prompt, memory: state.memory, memoryContext },
      });
      if (error) throw error;
      const response = data?.response ?? "No response received.";
      setBuilderHistory((prev) => [...prev, { prompt, response }]);
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            [`day1_builder_${Date.now()}`]: response,
          },
        },
      }));
    } catch (err: any) {
      toast.error(err?.message || "Couldn't reach the AI right now.");
    } finally {
      setBuilderLoading(false);
    }
  };

  

  return (
    <div className="app-page-container pt-6 pb-8 animate-fade-in">
      <div className="w-full max-w-md md:max-w-4xl mx-auto">
        {/* Day 1 header — persistent across steps */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Day 1 · Define the Transformation</p>
            <p className="mt-1 text-sm text-muted-foreground">Let’s shape your challenge.</p>
          </div>
          {(saved?.audienceType || step > 1) && (
            <RestartDay1Button variant="ghost" size="sm" className="shrink-0 text-xs text-muted-foreground" label="Restart" />
          )}
        </div>

        {step > 1 && step < 5 && (
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Who is your challenge for?</h1>
              <p className="text-muted-foreground">Let's clarify the audience first.</p>
            </div>
            <div className="space-y-3">
              {audienceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAudience(opt.value)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                    audienceType === opt.value ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <opt.icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">What result do they want?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {challengeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChallenge(opt.value)}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                    challengeType === opt.value ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <opt.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">What transformation will they experience?</h2>
              <p className="text-sm text-muted-foreground">Optional — you can skip this</p>
            </div>
            <div className="relative">
              <Input
                autoFocus
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
                placeholder="e.g. a finished landing page, a clear plan, a launched idea"
                className="h-14 text-base px-4 pr-24"
                onKeyDown={(e) => { if (e.key === "Enter") handleTopicNext(); }}
              />
              <DictateButton isListening={isDictating} onToggle={() => toggleDictation((text) => setTopicHint(text))} />
            </div>
            <Button size="lg" onClick={handleTopicNext} className="w-full h-12 text-base font-semibold">
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 4 && audienceType && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Here's what you're building</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                You're building a{" "}
                <span className="text-primary">{challengeLabel(challengeType)}</span> challenge for{" "}
                <span className="text-primary">{audienceLabel(audienceType)}</span>
              </h2>
            </div>
            {topicHint && (
              <div className="p-4 rounded-lg border border-border bg-card/60 text-left">
                <p className="text-sm text-muted-foreground">Transformation</p>
                <p className="font-medium mt-1">{topicHint}</p>
              </div>
            )}
            <p className="text-muted-foreground leading-relaxed">
              Next, your AI co-pilot will help you sharpen this into a challenge people will actually want to take.
            </p>
            <Button
              size="lg"
              onClick={handleSaveAssessment}
              className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Continue Building Your Challenge
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Build it with your AI co-pilot</h2>
              <p className="text-muted-foreground">
                Ask anything to refine your positioning, structure, hook, or transformation. Your assessment is already loaded as context.
              </p>
            </div>

            {/* Snapshot */}
            <div className="rounded-xl border border-border bg-card/60 p-4 text-sm">
              <p className="font-semibold text-foreground">
                A <span className="text-primary">{challengeLabel(challengeType)}</span> challenge for{" "}
                <span className="text-primary">{audienceLabel(audienceType as "b2b" | "b2c")}</span>
                {topicHint && <> — <span className="text-muted-foreground">{topicHint}</span></>}
              </p>
            </div>

            {/* Chat thread */}
            <div
              ref={messagesRef}
              className="rounded-xl border border-border bg-background p-4 min-h-[220px] max-h-[420px] overflow-y-auto space-y-4"
            >
              {builderHistory.length === 0 && !builderLoading && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Pick a starter below or type your own question to begin.
                </p>
              )}
              {builderHistory.map((entry, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                      {entry.prompt}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground prose prose-sm max-w-none">
                      <ReactMarkdown>{entry.response}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {builderLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              )}
            </div>

            {/* Starter prompts */}
            <div className="flex flex-wrap gap-2">
              {BUILDER_STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => askBuilder(s)}
                  disabled={builderLoading}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="rounded-xl border border-border bg-card p-3">
              <DictatedTextarea
                value={builderInput}
                onChange={(e) => setBuilderInput(e.target.value)}
                placeholder="Ask your AI co-pilot anything about your challenge…"
                className="min-h-[64px] border-0 focus-visible:ring-0 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askBuilder(); }
                }}
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={() => askBuilder()} disabled={builderLoading || !builderInput.trim()}>
                  <Send className="h-4 w-4 mr-1.5" />
                  Send
                </Button>
              </div>
            </div>

            {/* Finish Day 1 */}
            <div className="pt-2">
              <Button
                size="lg"
                onClick={handleFinishDay1}
                className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Complete Day 1 &amp; Unlock Day 2
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                You can return to this co-pilot anytime from your dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day1Setup;
