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
import TypingDots from "@/components/TypingDots";

// Conversational typing sequence — types each message in turn, calls onComplete after all done.
const TypedSequence = ({
  messages,
  onComplete,
  resetKey,
}: {
  messages: string[];
  onComplete?: () => void;
  resetKey: string | number;
}) => {
  const [shown, setShown] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [idx, setIdx] = useState(0);
  const [showDots, setShowDots] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    setShown([]);
    setCurrent("");
    setIdx(0);
    setShowDots(true);
    doneRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (idx >= messages.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
      return;
    }
    const full = messages[idx];
    setShowDots(true);
    setCurrent("");
    const dotsTimer = setTimeout(() => {
      setShowDots(false);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setCurrent(full.slice(0, i));
        if (i >= full.length) {
          clearInterval(interval);
          setTimeout(() => {
            setShown((prev) => [...prev, full]);
            setCurrent("");
            setIdx((prevIdx) => prevIdx + 1);
          }, 450);
        }
      }, 22);
      return () => clearInterval(interval);
    }, idx === 0 ? 350 : 650);
    return () => clearTimeout(dotsTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, resetKey]);

  return (
    <div className="space-y-3">
      {shown.map((m, i) => (
        <div key={i} className="flex animate-fade-in">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed">
            {m}
          </div>
        </div>
      ))}
      {idx < messages.length && (
        <div className="flex animate-fade-in">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed min-h-[44px]">
            {showDots ? <TypingDots /> : <span>{current}<span className="inline-block w-0.5 h-4 bg-foreground/60 ml-0.5 align-middle animate-pulse" /></span>}
          </div>
        </div>
      )}
    </div>
  );
};

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
  { value: "b2b" as const, label: "Businesses / Professionals", icon: Briefcase },
  { value: "b2c" as const, label: "Individuals / Consumers", icon: UserIcon },
];

const challengeOptions = [
  {
    value: "solve-problem",
    emoji: "🎯",
    label: "Solve a Problem",
    description: "Help participants overcome a specific problem that is holding them back.",
    summary: "Participants will solve a specific problem.",
  },
  {
    value: "quick-win",
    emoji: "⚡",
    label: "Achieve a Quick Win",
    description: "Help participants achieve a meaningful result quickly.",
    summary: "Participants will achieve an immediate result.",
  },
  {
    value: "create-asset",
    emoji: "🛠",
    label: "Create Something Valuable",
    description: "Help participants create something they can continue using after the challenge.",
    summary: "Participants will create something valuable.",
  },
  {
    value: "reach-milestone",
    emoji: "🚀",
    label: "Reach a Milestone",
    description: "Help participants make significant progress toward an important goal.",
    summary: "Participants will achieve a meaningful milestone.",
  },
];

const challengeLabel = (v: string) =>
  challengeOptions.find((o) => o.value === v)?.label ?? v;

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
}) => {
  const MIN = 160;
  const length = value.trim().length;
  const remaining = Math.max(0, MIN - length);
  const meetsMin = length >= MIN;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </div>

      <div className="space-y-2">
        <DictatedTextarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-h-[140px] text-base"
        />
        <p className={`text-xs ${meetsMin ? "text-muted-foreground" : "text-destructive"}`}>
          {meetsMin
            ? `${length} characters — minimum reached`
            : `${remaining} more character${remaining === 1 ? "" : "s"} needed (minimum ${MIN})`}
        </p>
      </div>

      <Button
        size="lg"
        onClick={onNext}
        disabled={!meetsMin}
        className="w-full h-12 text-base font-semibold"
      >
        Continue
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

const Day1Setup = ({ onComplete }: Props) => {
  const { state, setState } = useAppState();

  // Restore prior in-progress assessment from saved setup + persisted step
  const saved = (() => { try { return JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); } catch { return null; } })();
  const persistedStep = (() => { try { return Number(localStorage.getItem(DAY1_STEP_KEY)) as Step; } catch { return 0 as Step; } })();
  const hasFoundation = !!(saved?.problem && saved?.audience && saved?.how);
  const initialStep: Step = (() => {
    if (persistedStep === 2 || persistedStep === 3 || (persistedStep >= 4 && persistedStep <= 8)) return persistedStep as Step;
    if (saved?.audienceType && saved?.challengeType) return 6;
    if (saved?.audienceType) return 5;
    return 4;
  })();

  const [step, setStep] = useState<Step>(initialStep);

  // Conversational sub-phases for the AI-led steps.
  type ConvPhase = "intro" | "choose" | "ack";
  const [step4Phase, setStep4Phase] = useState<ConvPhase>(saved?.audienceType ? "choose" : "intro");
  const [step5Phase, setStep5Phase] = useState<ConvPhase>(saved?.challengeType ? "choose" : "intro");
  const [step6Phase, setStep6Phase] = useState<"intro" | "input">(saved?.topicHint ? "input" : "intro");
  const [step2Phase, setStep2Phase] = useState<"intro" | "input">(saved?.problem ? "input" : "intro");
  const [step3Phase, setStep3Phase] = useState<"intro" | "input">(saved?.how ? "input" : "intro");

  const firstName = ((state.user?.name || state.memory?.name || "") as string).trim().split(/\s+/)[0] || "there";
  // Natural-sounding personalisation token: ", Johnny" or "" if no name available.
  const fn = firstName && firstName !== "there" ? `, ${firstName}` : "";
  const Fn = firstName && firstName !== "there" ? `${firstName}, ` : "";

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

  // Flow order: 4 (audience type) → 5 (outcome) → 6 → 7 → 8
  const goBack = () => {
    const map: Record<number, Step> = { 2: 6, 3: 2, 5: 4, 6: 5, 7: 3 };
    const prev = map[step as number];
    if (prev !== undefined) setStep(prev);
  };
  // Persist foundation answers progressively so refresh doesn't wipe them.
  const persistFoundation = (patch: Partial<SetupData>) => {
    try {
      const current = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
      localStorage.setItem(SETUP_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {}
  };

  const handleFoundationNext = (current: 1 | 2 | 3) => {
    if (current === 1) {
      if (!audience.trim()) return;
      persistFoundation({ audience: audience.trim() });
      setStep(2);
    } else if (current === 2) {
      if (!problem.trim()) return;
      persistFoundation({ problem: problem.trim() });
      setStep3Phase(saved?.how ? "input" : "intro");
      setStep(3);
    } else {
      if (!how.trim()) return;
      persistFoundation({ how: how.trim() });
      // Save into memory + aiOutputs so the AI uses this as the desired outcome.
      setState((prev) => ({
        ...prev,
        memory: mergeMemory(prev.memory, {
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
      setStep(7);
    }
  };

  const handleAudience = (v: "b2b" | "b2c") => {
    setAudienceType(v);
    persistFoundation({ audienceType: v });
    setStep4Phase("ack");
  };
  const handleChallenge = (v: string) => {
    setChallengeType(v);
    const summary = challengeOptions.find((o) => o.value === v)?.summary ?? "";
    persistFoundation({ challengeType: v, desiredOutcome: summary } as Partial<SetupData>);
    setStep5Phase("ack");
  };
  const handleTopicNext = () => {
    if (!topicHint.trim()) return;
    setStep2Phase(saved?.problem ? "input" : "intro");
    setStep(2);
  };

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

        {step === 1 && (
          <FoundationStep
            n={1}
            title="Who is your challenge for?"
            helper="Let's clarify the audience first — who is this person, what stage are they in, what do they want?"
            value={audience}
            setValue={setAudience}
            placeholder="e.g. New coaches, 0–12 months in, who have expertise but no offer."
            onNext={() => handleFoundationNext(1)}
          />
        )}

        {step === 2 && (() => {
          const problemPlaceholderMap: Record<string, string> = {
            "b2b|solve-problem": "e.g. They rely heavily on referrals and struggle to generate predictable enquiries.",
            "b2b|quick-win": "e.g. They need a faster way to attract opportunities and generate momentum.",
            "b2b|create-asset": "e.g. They struggle to clearly communicate the value of what they offer.",
            "b2b|reach-milestone": "e.g. They aren't making enough progress toward the business growth they want.",
            "b2c|solve-problem": "e.g. They struggle to stay consistent with healthy habits.",
            "b2c|quick-win": "e.g. They want to feel more motivated, focused, and productive.",
            "b2c|create-asset": "e.g. They don't have a practical plan they can follow with confidence.",
            "b2c|reach-milestone": "e.g. They keep falling short of a goal they genuinely want to achieve.",
          };
          const problemPlaceholder =
            problemPlaceholderMap[`${audienceType}|${challengeType}`] ??
            "e.g. The specific frustration, pain point, or obstacle holding them back right now.";

          const problemWords = problem.trim().split(/\s+/).filter(Boolean).length;
          const problemFeedbackPool = [
            "I can see why that's frustrating.",
            "That gives me a much clearer picture.",
            "Now we're getting to the heart of the problem.",
            "That's exactly the kind of insight that helps build a great challenge.",
          ];
          const problemFeedback =
            problemWords >= 5
              ? problemFeedbackPool[Math.min(Math.floor(problemWords / 6), problemFeedbackPool.length - 1)]
              : null;

          return (
            <div className="space-y-6 animate-fade-in">
              {step2Phase === "intro" && (
                <TypedSequence
                  resetKey="step2-intro"
                  messages={[
                    `Perfect${fn}.`,
                    "I know who you're helping.",
                    "Now let's understand what's getting in their way.",
                    "What is frustrating them right now?",
                    "Tell me about the problem, obstacle, pain point, or situation they're trying to overcome.",
                  ]}
                  onComplete={() => setStep2Phase("input")}
                />
              )}

              {step2Phase === "input" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed">
                      What is frustrating them right now? Tell me about the problem, obstacle, or pain point they're trying to overcome.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">What is frustrating them right now?</label>
                    <DictatedTextarea
                      autoFocus
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder={problemPlaceholder}
                      rows={5}
                      className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFoundationNext(2);
                      }}
                    />
                    {problemFeedback && (
                      <div className="flex animate-fade-in pt-1">
                        <div className="max-w-[90%] rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs md:text-sm text-muted-foreground italic">
                          {problemFeedback}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    size="lg"
                    onClick={() => handleFoundationNext(2)}
                    disabled={!problem.trim()}
                    className="w-full h-12 text-base font-semibold"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })()}

        {step === 3 && (() => {
          const outcomePlaceholderMap: Record<string, string> = {
            "b2b|solve-problem": "e.g. They'll move from relying on referrals to having a predictable way to generate leads.",
            "b2b|quick-win": "e.g. They'll gain confidence by generating their first qualified opportunity.",
            "b2b|create-asset": "e.g. They'll leave with a clear offer they can confidently present to prospects.",
            "b2b|reach-milestone": "e.g. They'll move from uncertainty to securing their first paying clients.",
            "b2c|solve-problem": "e.g. They'll feel more in control and confident in their daily habits.",
            "b2c|quick-win": "e.g. They'll experience an immediate boost in confidence and momentum.",
            "b2c|create-asset": "e.g. They'll leave with a practical tool or plan they can continue using.",
            "b2c|reach-milestone": "e.g. They'll make meaningful progress toward a goal they've struggled to achieve.",
          };
          const outcomePlaceholder =
            outcomePlaceholderMap[`${audienceType}|${challengeType}`] ??
            "e.g. The transformation, result, or change participants will experience by the end.";

          const outcomeWords = how.trim().split(/\s+/).filter(Boolean).length;
          const outcomeFeedbackPool = [
            "I like that.",
            "That's a meaningful outcome.",
            "I can see why people would want that result.",
            "Now the transformation is becoming clear.",
            "That's the kind of result that motivates people to take action.",
          ];
          const outcomeFeedback =
            outcomeWords >= 5
              ? outcomeFeedbackPool[Math.min(Math.floor(outcomeWords / 6), outcomeFeedbackPool.length - 1)]
              : null;

          return (
            <div className="space-y-6 animate-fade-in">
              {step3Phase === "intro" && (
                <TypedSequence
                  resetKey="step3-intro"
                  messages={[
                    "Great.",
                    "We know who you're helping.",
                    "We know what's getting in their way.",
                    "Now let's define the outcome.",
                    "What will be different for participants by the end of your challenge?",
                    "Describe the result, improvement, or change they'll experience.",
                  ]}
                  onComplete={() => setStep3Phase("input")}
                />
              )}

              {step3Phase === "input" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed">
                      What will be different for participants by the end of your challenge? Describe the result, improvement, or change they'll experience.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">What will be different for participants by the end of your challenge?</label>
                    <DictatedTextarea
                      autoFocus
                      value={how}
                      onChange={(e) => setHow(e.target.value)}
                      placeholder={outcomePlaceholder}
                      rows={5}
                      className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFoundationNext(3);
                      }}
                    />
                    {outcomeFeedback && (
                      <div className="flex animate-fade-in pt-1">
                        <div className="max-w-[90%] rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs md:text-sm text-muted-foreground italic">
                          {outcomeFeedback}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    size="lg"
                    onClick={() => handleFoundationNext(3)}
                    disabled={!how.trim()}
                    className="w-full h-12 text-base font-semibold"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })()}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            {step4Phase === "intro" && (
              <TypedSequence
                resetKey="step4-intro"
                messages={[
                  `Hi ${firstName}.`,
                  "Let's build your challenge together.",
                  "First, I need to understand who you want to help.",
                ]}
                onComplete={() => setStep4Phase("choose")}
              />
            )}

            {step4Phase === "choose" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed">
                    First, I need to understand who you want to help.
                  </div>
                </div>
                <div role="radiogroup" aria-label="Audience" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      value: "b2b" as const,
                      emoji: "🏢",
                      label: "Business & Professionals",
                      description: "Help business owners, consultants, coaches, experts, teams, or organisations achieve a meaningful result.",
                    },
                    {
                      value: "b2c" as const,
                      emoji: "👥",
                      label: "Individuals & Consumers",
                      description: "Help people improve an area of their life, health, finances, career, mindset, relationships, or wellbeing.",
                    },
                  ].map((opt) => {
                    const selected = audienceType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleAudience(opt.value)}
                        className={`flex items-start gap-3 p-5 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                          selected ? "border-primary bg-primary/10" : "border-border bg-card"
                        }`}
                      >
                        <span
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? "border-primary" : "border-muted-foreground/40"
                          }`}
                          aria-hidden
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="flex flex-col gap-1">
                          <span className="text-base font-semibold">
                            <span className="mr-1.5">{opt.emoji}</span>
                            {opt.label}
                          </span>
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {opt.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step4Phase === "ack" && audienceType && (
              <TypedSequence
                resetKey={`step4-ack-${audienceType}`}
                messages={[
                  audienceType === "b2b"
                    ? "Perfect. We'll build this for a business audience."
                    : "Perfect. We'll build this for an individual audience.",
                ]}
                onComplete={() => {
                  setStep(5);
                  setStep5Phase("intro");
                }}
              />
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            {step5Phase === "intro" && (
              <TypedSequence
                resetKey="step5-intro"
                messages={[
                  `${firstName}, what result do you want participants to achieve?`,
                  "Choose the primary outcome participants should achieve by the end of your challenge.",
                ]}
                onComplete={() => setStep5Phase("choose")}
              />
            )}

            {step5Phase === "choose" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed">
                    <p className="font-semibold text-foreground mb-1">{firstName}, what result do you want participants to achieve?</p>
                    <p>Choose the primary outcome participants should achieve by the end of your challenge.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {challengeOptions.map((opt) => {
                    const selected = challengeType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleChallenge(opt.value)}
                        className={`flex items-start gap-3 p-5 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                          selected ? "border-primary bg-primary/10" : "border-border bg-card"
                        }`}
                      >
                        <span
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? "border-primary" : "border-muted-foreground/40"
                          }`}
                          aria-hidden
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="flex flex-col gap-1">
                          <span className="text-base font-semibold">
                            <span className="mr-1.5">{opt.emoji}</span>
                            {opt.label}
                          </span>
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {opt.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step5Phase === "ack" && challengeType && (
              <TypedSequence
                resetKey={`step5-ack-${challengeType}`}
                messages={[
                  "Got it.",
                  `You're helping people ${(challengeLabel(challengeType) || "").toLowerCase()}.`,
                ]}
                onComplete={() => { setStep6Phase("intro"); setStep(6); }}
              />
            )}
          </div>
        )}

        {step === 6 && (() => {
          const placeholderMap: Record<string, string> = {
            "b2b|solve-problem": "e.g. Coaches and consultants who struggle to generate a consistent flow of qualified leads.",
            "b2b|quick-win": "e.g. Small business owners who want to attract their first new client.",
            "b2b|create-asset": "e.g. Experts who need a compelling offer they can confidently sell.",
            "b2b|reach-milestone": "e.g. Service providers aiming to secure their first five paying clients.",
            "b2c|solve-problem": "e.g. Busy parents who struggle to maintain healthy habits.",
            "b2c|quick-win": "e.g. People who want to feel more energetic and productive.",
            "b2c|create-asset": "e.g. Individuals who want to create a personal budget they can stick to.",
            "b2c|reach-milestone": "e.g. Adults working toward losing their first 10 pounds.",
          };
          const placeholder =
            placeholderMap[`${audienceType}|${challengeType}`] ??
            "e.g. Describe the specific person you want to help — who they are, what stage they're at, and what they want.";

          const wordCount = topicHint.trim().split(/\s+/).filter(Boolean).length;
          const feedbackPool = [
            "Perfect. I can already see who this challenge is designed for.",
            "That's helpful. Let's build on that.",
            "Great. The audience is becoming much clearer.",
          ];
          const feedback = wordCount >= 4 ? feedbackPool[Math.min(Math.floor(wordCount / 6), feedbackPool.length - 1)] : null;

          return (
            <div className="space-y-6 animate-fade-in">
              {step6Phase === "intro" && (
                <TypedSequence
                  resetKey="step6-intro"
                  messages={[
                    "Excellent.",
                    "I'm starting to get a picture of the challenge you're creating.",
                    "Now tell me about the people you're helping.",
                    "The more specific you are, the better I can tailor the challenge.",
                  ]}
                  onComplete={() => setStep6Phase("input")}
                />
              )}

              {step6Phase === "input" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm md:text-base leading-relaxed">
                      Now tell me about the people you're helping. The more specific you are, the better I can tailor the challenge.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Who do you help?</label>
                    <DictatedTextarea
                      autoFocus
                      value={topicHint}
                      onChange={(e) => setTopicHint(e.target.value)}
                      placeholder={placeholder}
                      rows={5}
                      className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTopicNext();
                      }}
                    />
                    {feedback && (
                      <div className="flex animate-fade-in pt-1">
                        <div className="max-w-[90%] rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs md:text-sm text-muted-foreground italic">
                          {feedback}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    size="lg"
                    onClick={handleTopicNext}
                    disabled={!topicHint.trim()}
                    className="w-full h-12 text-base font-semibold"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })()}

        {step === 7 && audienceType && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Here's what you're building</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                You're building a{" "}
                <span className="text-primary">“{challengeLabel(challengeType)}”</span> challenge for{" "}
                <span className="text-primary">“{audienceLabelShort(audienceType)}”</span>
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

            {/* Snapshot */}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Your Starting Point</h2>
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
                You can get help from Johnny AI anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day1Setup;
