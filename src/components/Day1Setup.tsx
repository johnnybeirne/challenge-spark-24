import { useEffect, useRef, useState } from "react";
import { Briefcase, User as UserIcon, Zap, Sparkles, GraduationCap, Rocket, ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { useAppState } from "@/context/AppContext";
import { mergeMemory, normalizeChallengeType, copilotMemoryContext } from "@/lib/personalisation";
import DictateButton from "@/components/DictateButton";
import { useDictation } from "@/hooks/useDictation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";

import LearningAssistant from "@/components/LearningAssistant";

import { pushNotification } from "@/lib/notifications";

export const SETUP_KEY = "leadio_setup";
const DAY1_STEP_KEY = "leadio_day1_step";

export interface SetupData {
  completed: boolean;
  audienceType: "b2b" | "b2c";
  challengeType: string;
  topicHint: string;
  desiredOutcome?: string;
  // Foundation answers — captured first, drive every downstream AI prompt.
  problem?: string;
  audience?: string;
  how?: string;
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

// Intro (0) → Foundation (1-3) → Refinement (4-7) → AI Builder (8)
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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

const audienceLabelShort = (v: "b2b" | "b2c") =>
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

const FoundationStep = ({
  title,
  helper,
  value,
  setValue,
  placeholder,
  onNext,
}: {
  n?: 1 | 2 | 3;
  title: string;
  helper: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
  onNext: () => void;
}) => (
  <div className="space-y-6 animate-fade-in">
    <div className="space-y-2">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{helper}</p>
    </div>

    <DictatedTextarea
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="min-h-[140px] text-base"
    />

    <Button
      size="lg"
      onClick={onNext}
      disabled={!value.trim()}
      className="w-full h-12 text-base font-semibold"
    >
      Continue
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </div>
);

const Day1Setup = ({ onComplete }: Props) => {
  const { state, setState } = useAppState();

  // Restore prior in-progress assessment from saved setup + persisted step
  const saved = (() => { try { return JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); } catch { return null; } })();
  const persistedStep = (() => { try { return Number(localStorage.getItem(DAY1_STEP_KEY)) as Step; } catch { return 0 as Step; } })();
  const hasFoundation = !!(saved?.problem && saved?.audience && saved?.how);
  const initialStep: Step = (() => {
    if (persistedStep >= 0 && persistedStep <= 8) return persistedStep as Step;
    if (saved?.audienceType) return 8;
    if (hasFoundation) return 4;
    if (saved?.problem || saved?.audience || saved?.how) return 1;
    return 0;
  })();


  const [step, setStep] = useState<Step>(initialStep);

  // Foundation answers
  const [problem, setProblem] = useState<string>(saved?.problem ?? "");
  const [audience, setAudience] = useState<string>(saved?.audience ?? "");
  const [how, setHow] = useState<string>(saved?.how ?? "");

  // Refinement answers
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

  const goBack = () => setStep(Math.max(1, (step as number) - 1) as Step);

  // Persist foundation answers progressively so refresh doesn't wipe them.
  const persistFoundation = (patch: Partial<SetupData>) => {
    try {
      const current = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
      localStorage.setItem(SETUP_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {}
  };

  const handleFoundationNext = (current: 1 | 2 | 3) => {
    if (current === 1) {
      if (!problem.trim()) return;
      persistFoundation({ problem: problem.trim() });
      setStep(2);
    } else if (current === 2) {
      if (!audience.trim()) return;
      persistFoundation({ audience: audience.trim() });
      setStep(3);
    } else {
      if (!how.trim()) return;
      persistFoundation({ how: how.trim() });
      // Save into memory + aiOutputs so AI uses these as foundational context.
      setState((prev) => ({
        ...prev,
        memory: mergeMemory(prev.memory, {
          topic: problem.trim(),
          desiredOutcome: how.trim(),
        }),
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            day1_foundation: JSON.stringify({
              problem: problem.trim(),
              audience: audience.trim(),
              how: how.trim(),
            }),
          },
        },
      }));
      trackEvent("memory_created", { source: "day1_foundation" });
      pushNotification({
        title: "Profile updated",
        message: "We've updated your profile with your challenge answers.",
        href: "/profile",

        dedupeKey: "day1_foundation_saved",
      });
      setStep(4);
    }
  };

  const handleAudience = (v: "b2b" | "b2c") => { setAudienceType(v); advance(5); };
  const handleChallenge = (v: string) => { setChallengeType(v); advance(6); };
  const handleTopicNext = () => setStep(7);

  // Step 7 → save the refinement, advance to the AI-guided builder (step 8).
  const handleSaveAssessment = () => {
    if (!audienceType || !challengeType) return;
    const data: SetupData = {
      completed: true,
      audienceType,
      challengeType,
      topicHint: topicHint.trim(),
      desiredOutcome: topicHint.trim(),
      problem: problem.trim(),
      audience: audience.trim(),
      how: how.trim(),
    };
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(data)); } catch {}

    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, {
        name: prev.user?.name || prev.memory.name,
        audienceType,
        challengeType: normalizeChallengeType(challengeType),
        desiredOutcome: topicHint || how,
        topic: topicHint || problem,
      }),
      challenge: {
        ...prev.challenge,
        aiOutputs: {
          ...prev.challenge.aiOutputs,
          day1_assessment: JSON.stringify({
            problem: problem.trim(),
            audience: audience.trim(),
            how: how.trim(),
            audienceType,
            challengeType,
            transformation: topicHint,
          }),
        },
      },
    }));

    trackEvent("onboarding_invite_completed", { audienceType, challengeType });
    trackEvent("memory_created", { source: "day1_assessment" });
    pushNotification({
      title: "Challenge direction saved",
      message: "We've updated your profile with your challenge answers.",
      href: "/challenger-dashboard",
      dedupeKey: "day1_assessment_saved",
    });
    setStep(8);
  };

  // Step 8 → finalise Day 1 (Training.tsx bumps currentDay to 2 + marks day1Watched)
  const handleFinishDay1 = () => {
    if (!audienceType || !challengeType) return;
    const data: SetupData = {
      completed: true,
      audienceType,
      challengeType,
      topicHint: topicHint.trim(),
      desiredOutcome: topicHint.trim(),
      problem: problem.trim(),
      audience: audience.trim(),
      how: how.trim(),
    };
    try { localStorage.removeItem(DAY1_STEP_KEY); } catch {}
    trackEvent("day_completed", { day: 1 });
    onComplete(data);
  };

  const askBuilder = async (prompt: string): Promise<string> => {
    try {
      const memoryContext = copilotMemoryContext(state.memory);
      const foundationLine = `Foundation answers — Problem: ${problem}. Audience: ${audience}. How they solve it: ${how}.`;
      const { data, error } = await supabase.functions.invoke("copilot", {
        body: {
          prompt,
          memory: state.memory,
          memoryContext: `${memoryContext}\n${foundationLine}`,
        },
      });
      if (error) throw error;
      const response = data?.response ?? "No response received.";
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
      return response;
    } catch (err: any) {
      const msg = err?.message || "Couldn't reach the AI right now.";
      toast.error(msg);
      return `_${msg}_`;
    }
  };




  return (
    <div className="app-page-container pt-6 pb-8 animate-fade-in">
      <div className="w-full max-w-md md:max-w-4xl mx-auto">
        {/* No restart control — Day 1 answers are edited in-place during the 24h window. */}


        {step > 1 && step < 8 && (
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {step === 0 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Let's Shape Your Challenge</h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Define the transformation your challenge takers will achieve.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "What problem do you solve?",
                "Who do you solve it for?",
                "How do you solve it?",
              ].map((q, i) => (
                <li key={q} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                    {i + 1}
                  </span>
                  <span className="text-base font-semibold text-foreground">{q}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              onClick={() => setStep(1)}
              className="w-full h-12 text-base font-semibold"
            >
              Start
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}


        {step === 1 && (
          <FoundationStep
            n={1}
            title="What problem do you solve?"
            helper="In your own words — the pain, frustration, or gap your work removes."
            value={problem}
            setValue={setProblem}
            placeholder="e.g. Coaches struggle to package what they know into something people will pay for."
            onNext={() => handleFoundationNext(1)}
          />
        )}

        {step === 2 && (
          <FoundationStep
            n={2}
            title="Who do you solve it for?"
            helper="Be specific — who is this person, what stage are they in, what do they want?"
            value={audience}
            setValue={setAudience}
            placeholder="e.g. New coaches, 0–12 months in, who have expertise but no offer."
            onNext={() => handleFoundationNext(2)}
          />
        )}

        {step === 3 && (
          <FoundationStep
            n={3}
            title="How do you solve it?"
            helper="Your method, framework, or approach — what makes the result happen."
            value={how}
            setValue={setHow}
            placeholder="e.g. A 3-step packaging system that turns expertise into a signature offer."
            onNext={() => handleFoundationNext(3)}
          />
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Who is your challenge for?</h1>
              <p className="text-muted-foreground">Let's clarify the audience first.</p>
            </div>
            <div role="radiogroup" aria-label="Audience" className="grid grid-cols-2 gap-3">
              {audienceOptions.map((opt) => {
                const selected = audienceType === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleAudience(opt.value)}
                    className={`relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 text-center transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                      selected ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    <span
                      className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                        selected ? "border-primary" : "border-border"
                      }`}
                    >
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <opt.icon className="h-6 w-6" />
                    </div>
                    <span className="font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">What result do you want them to achieve with your challenge?</h2>
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

        {step === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">What transformation will they experience?</h2>
              <p className="text-sm text-muted-foreground">Describe how they will feel, what they will know, or what they will be able to do after they complete your challenge.</p>
            </div>
            <DictatedTextarea
              autoFocus
              value={topicHint}
              onChange={(e) => setTopicHint(e.target.value)}
              placeholder="e.g. They'll finish with a launched landing page, a clear 3-day plan they can repeat, and the confidence to share it publicly."
              rows={5}
              className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTopicNext();
              }}
            />

            <Button size="lg" onClick={handleTopicNext} className="w-full h-12 text-base font-semibold">
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 7 && audienceType && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Here's what you're building</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                You're building a{" "}
                <span className="text-primary">{challengeLabel(challengeType)}</span> challenge for{" "}
                <span className="text-primary">{audienceLabelShort(audienceType)}</span>
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

        {step === 8 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Build it with your AI co-pilot</h2>
              <p className="text-muted-foreground">
                Ask anything to refine your positioning, structure, hook, or transformation. Your foundation answers are already loaded as context.
              </p>
            </div>

            {/* Snapshot */}
            <div className="rounded-xl border border-border bg-card/60 p-4 text-sm space-y-2">
              <p className="font-semibold text-foreground">
                A <span className="text-primary">{challengeLabel(challengeType)}</span> challenge for{" "}
                <span className="text-primary">{audienceLabelShort(audienceType as "b2b" | "b2c")}</span>
                {topicHint && <> — <span className="text-muted-foreground">{topicHint}</span></>}
              </p>
              {(problem || audience || how) && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {problem && <p><span className="font-semibold text-foreground">Problem:</span> {problem}</p>}
                  {audience && <p><span className="font-semibold text-foreground">For:</span> {audience}</p>}
                  {how && <p><span className="font-semibold text-foreground">How:</span> {how}</p>}
                </div>
              )}
            </div>

            {/* Learning assistant — prompt pills + accordion chat + freeform */}
            <LearningAssistant
              topic={topicHint || challengeLabel(challengeType)}
              prompts={BUILDER_STARTERS}
              ask={askBuilder}
            />

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
