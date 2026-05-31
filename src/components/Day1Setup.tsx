import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, User as UserIcon, Zap, Sparkles, GraduationCap, Rocket, ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2, Users, AlertCircle, Target, Quote, Compass, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import DayVideoModal from "@/components/DayVideoModal";

import { pushNotification } from "@/lib/notifications";
import TypingDots from "@/components/TypingDots";
import johnnyAvatar from "@/assets/johnny-beirne.png";
import { isDay1ResetOpen } from "@/lib/day1Reset";

const JohnnyAvatar = () => (
  <img
    src={johnnyAvatar}
    alt="Johnny AI"
    className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
  />
);

// Static rendering of the AI conversation block — used to keep the prior typed
// message visible alongside the response controls (matches the look of
// TypedSequence after typing has finished).
const StaticAi = ({ messages }: { messages: string[] }) => (
  <div className="flex items-start gap-3">
    <JohnnyAvatar />
    <div className="flex-1 space-y-1.5 min-w-0">
      {messages.map((m, i) => (
        <div key={i} className="flex">
          <div className="max-w-[90%] px-1 py-0.5 text-sm md:text-base leading-snug">
            {m}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Shows "Making notes..." for 2s on first mount, then reveals the live feedback text.
const DelayedFeedback = ({ text }: { text: string }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex animate-fade-in pt-1">
      <div className="max-w-[90%] rounded-xl px-3 py-2 text-xs md:text-sm text-foreground/80 italic">
        {ready ? text : <span className="text-muted-foreground">Making notes<span className="inline-block animate-pulse">...</span></span>}
      </div>
    </div>
  );
};

// Wraps response controls (cards, textarea, button) so they pause briefly after
// the AI message completes, then rise gently into view.
const RevealControls = ({
  children,
  className = "",
  delay = 250,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <div {...rest} className={`animate-rise-in ${className}`}>
      {children}
    </div>
  );
};



// Conversational typing sequence — types each message in turn, calls onComplete after all done.
const TypedSequence = ({
  messages,
  onComplete,
  resetKey,
  skipMakingNotes = false,
}: {
  messages: string[];
  onComplete?: () => void;
  resetKey: string | number;
  skipMakingNotes?: boolean;
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
        // Final read-pause before advancing — gives the user a moment to absorb.
        const last = messages[messages.length - 1] ?? "";
        const finalPause = last.length > 60 ? 1300 : last.length > 30 ? 1000 : 800;
        const t = setTimeout(() => onComplete?.(), finalPause);
        return () => clearTimeout(t);
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
          // Pause after each message — longer for longer messages.
          const betweenPause = full.length > 60 ? 1100 : full.length > 30 ? 850 : 650;
          setTimeout(() => {
            setShown((prev) => [...prev, full]);
            setCurrent("");
            setIdx((prevIdx) => prevIdx + 1);
          }, betweenPause);
        }
      }, 22);
      return () => clearInterval(interval);
    }, idx === 0 ? (skipMakingNotes ? 200 : 2000) : 750);
    return () => clearTimeout(dotsTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, resetKey]);


  const isMakingNotes = !skipMakingNotes && idx === 0 && showDots && shown.length === 0;

  return (
    <div className="flex items-start gap-3">
      <JohnnyAvatar />
      <div className="flex-1 space-y-3 min-w-0">
        {shown.map((m, i) => (
          <div key={i} className="flex animate-fade-in">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm md:text-base leading-relaxed">
              {m}
            </div>
          </div>
        ))}
        {idx < messages.length && (
          <div className="flex animate-fade-in">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm md:text-base leading-relaxed min-h-[44px]">
              {isMakingNotes ? (
                <span className="italic text-muted-foreground">Making notes<span className="inline-block animate-pulse">...</span></span>
              ) : showDots ? (
                <TypingDots />
              ) : (
                <span>{current}<span className="inline-block w-0.5 h-4 bg-foreground/60 ml-0.5 align-middle animate-pulse" /></span>
              )}
            </div>
          </div>
        )}
      </div>
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
  outcome?: string;
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

// Sequence: 4 audience-type → 1 who you serve → 5 result type → 6 avatar detail
// → 2 problem → 3 process → 9 result → 7 promise → 8 AI builder.
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const audienceOptions = [
  { value: "b2b" as const, label: "Businesses / Professionals", icon: Briefcase },
  { value: "b2c" as const, label: "Individuals / Consumers", icon: UserIcon },
];

const challengeOptions = [
  {
    value: "solve-problem",
    emoji: "🎯",
    label: "Solve a Problem",
    description: "Overcome a specific blocker.",
    summary: "Participants will solve a specific problem.",
  },
  {
    value: "quick-win",
    emoji: "⚡",
    label: "Achieve a Quick Win",
    description: "Deliver a meaningful result fast.",
    summary: "Participants will achieve an immediate result.",
  },
  {
    value: "create-asset",
    emoji: "🛠",
    label: "Create Something Valuable",
    description: "Build something they keep using.",
    summary: "Participants will create something valuable.",
  },
  {
    value: "reach-milestone",
    emoji: "🚀",
    label: "Reach a Milestone",
    description: "Progress toward an important goal.",
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
  const length = value.trim().length;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      </div>


      <div className="space-y-2">
        <DictatedTextarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-h-[140px] text-base"
        />
        {length > 0 && (
          <p className="text-xs text-muted-foreground">{length} characters</p>
        )}
      </div>

      <Button
        size="lg"
        onClick={onNext}
        className="w-full h-12 text-base font-semibold"
      >
        Continue
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

const Day1Setup = ({ onComplete }: Props) => {
  const { state, setState, authUser } = useAppState();
  const navigate = useNavigate();

  const handleResetDay1 = () => {
    try {
      localStorage.removeItem(SETUP_KEY);
      localStorage.setItem(DAY1_STEP_KEY, "4");
    } catch {}
    setState((prev) => {
      const aiOutputs = Object.fromEntries(
        Object.entries(prev.challenge.aiOutputs ?? {}).filter(([k]) => !k.startsWith("day1_")),
      );
      const tasks = Object.fromEntries(
        Object.entries(prev.challenge.tasks ?? {}).filter(([k]) => !k.startsWith("day1_")),
      );
      return {
        ...prev,
        challenge: { ...prev.challenge, currentDay: 1, aiOutputs, tasks },
        training: { ...prev.training, day1Watched: false },
        memory: {
          ...prev.memory,
          topic: "",
          desiredOutcome: "",
          audienceType: undefined as any,
          challengeType: undefined as any,
        },
      };
    });
    trackEvent("day1_reset" as any, {});
    toast.success("Day 1 reset — let's start again.");
    try { window.location.reload(); } catch {}
  };

  // Restore prior in-progress assessment from saved setup + persisted step
  const saved = (() => { try { return JSON.parse(localStorage.getItem(SETUP_KEY) || "null"); } catch { return null; } })();
  const persistedStep = (() => { try { return Number(localStorage.getItem(DAY1_STEP_KEY)) as Step; } catch { return 0 as Step; } })();
  const hasFoundation = !!(saved?.problem && saved?.audience && saved?.how);

  // Audience type may already be known from earlier surfaces (signup, assessment).
  // Pull it from saved setup first, then from memory, so Day 1 never re-asks B2B vs B2C.
  const memoryAudienceType =
    state.memory?.audienceType === "b2b" || state.memory?.audienceType === "b2c"
      ? (state.memory.audienceType as "b2b" | "b2c")
      : null;
  const knownAudienceType: "b2b" | "b2c" | null =
    saved?.audienceType ?? memoryAudienceType;

  const initialStep: Step = (() => {
    if (persistedStep === 1 || persistedStep === 2 || persistedStep === 3 || persistedStep === 9 || (persistedStep >= 4 && persistedStep <= 8)) return persistedStep as Step;
    return 4;
  })();

  const [step, setStep] = useState<Step>(initialStep);

  // Conversational sub-phases for the AI-led steps.
  type ConvPhase = "intro" | "choose" | "ack";
  const [step4Phase, setStep4Phase] = useState<ConvPhase>(saved?.audienceType ? "choose" : "intro");
  const [step5Phase, setStep5Phase] = useState<ConvPhase>(saved?.challengeType ? "choose" : "intro");
  const [step6Phase, setStep6Phase] = useState<"intro" | "input">(saved?.topicHint ? "input" : "intro");
  const [step1Phase, setStep1Phase] = useState<"intro" | "input">(saved?.audience ? "input" : "intro");
  const [step2Phase, setStep2Phase] = useState<"intro" | "input">(saved?.problem ? "input" : "intro");
  const [step3Phase, setStep3Phase] = useState<"intro" | "input">(saved?.how ? "input" : "intro");
  const [step9Phase, setStep9Phase] = useState<"intro" | "input">(saved?.outcome ? "input" : "intro");
  const [step7Phase, setStep7Phase] = useState<"intro" | "reveal">("intro");

  const rawName =
    (state.user?.name as string | undefined) ||
    (state.memory?.name as string | undefined) ||
    (authUser?.user_metadata?.full_name as string | undefined) ||
    (authUser?.user_metadata?.name as string | undefined) ||
    (authUser?.user_metadata?.first_name as string | undefined) ||
    (typeof authUser?.email === "string" ? authUser.email.split("@")[0] : "") ||
    "";
  const firstName = rawName.trim().split(/\s+/)[0] || "there";
  // Natural-sounding personalisation token: ", Johnny" or "" if no name available.
  const fn = firstName && firstName !== "there" ? `, ${firstName}` : "";
  const Fn = firstName && firstName !== "there" ? `${firstName}, ` : "";

  // Foundation answers
  const [problem, setProblem] = useState<string>(saved?.problem ?? "");
  const [audience, setAudience] = useState<string>(saved?.audience ?? "");
  const [how, setHow] = useState<string>(saved?.how ?? "");
  const [outcome, setOutcome] = useState<string>(saved?.outcome ?? "");

  // Refinement answers
  const [audienceType, setAudienceType] = useState<"b2b" | "b2c" | null>(knownAudienceType);
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

  // If audience type came from memory (not saved), write it into setup so the
  // rest of the flow treats it as confirmed and we never re-ask B2B vs B2C.
  useEffect(() => {
    if (!saved?.audienceType && memoryAudienceType) {
      try {
        const current = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
        if (!current.audienceType) {
          localStorage.setItem(
            SETUP_KEY,
            JSON.stringify({ ...current, audienceType: memoryAudienceType }),
          );
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = (next: Step) => setTimeout(() => setStep(next), 250);

  // Sequence: 4 → 1 → 5 → 6 → 2 → 3 → 9 → 7 → 8.
  const goBack = () => {
    const baseMap: Record<number, Step> = { 1: 4, 5: 1, 6: 5, 2: 6, 3: 2, 9: 3, 7: 9 };
    const prev = baseMap[step as number];
    if (prev !== undefined) setStep(prev);
  };
  // Persist foundation answers progressively so refresh doesn't wipe them.
  const persistFoundation = (patch: Partial<SetupData>) => {
    try {
      const current = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
      localStorage.setItem(SETUP_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {}
  };

  // Top-right confirmation that the latest answer has been written to the
  // user's dashboard (memory auto-syncs to user_memory via useSupabaseSync).
  const profileSaved = (label: string) =>
    toast.success("Your dashboard is updated", {
      description: label,
      position: "top-left",
      duration: 3500,
      action: {
        label: "Dashboard",
        onClick: () => navigate("/challenger-dashboard"),
      },
    });

  const handleFoundationNext = (current: 1 | 2 | 3) => {
    if (current === 1) {
      if (!audience.trim()) return;
      persistFoundation({ audience: audience.trim() });
      profileSaved("Who you serve");
      setStep5Phase(saved?.challengeType ? "choose" : "intro");
      setStep(5);
    } else if (current === 2) {
      if (!problem.trim()) return;
      persistFoundation({ problem: problem.trim() });
      profileSaved("The problem you're solving");
      setStep3Phase(saved?.how ? "input" : "intro");
      setStep(3);
    } else {
      if (!how.trim()) return;
      persistFoundation({ how: how.trim() });
      setState((prev) => ({
        ...prev,
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
      profileSaved("How you create the result");
      setStep9Phase(saved?.outcome ? "input" : "intro");
      setStep(9);
    }
  };

  const handleOutcomeNext = () => {
    if (!outcome.trim()) return;
    persistFoundation({ outcome: outcome.trim() });
    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, { desiredOutcome: outcome.trim() }),
    }));
    profileSaved("The outcome you'll deliver");
    pushNotification({
      title: "Dashboard updated",
      message: "Your dashboard now reflects your latest challenge answers.",
      href: "/challenger-dashboard",
      dedupeKey: "day1_outcome_saved",
    });
    setStep7Phase("intro");
    setStep(7);
  };

  const handleAudience = (v: "b2b" | "b2c") => {
    setAudienceType(v);
    persistFoundation({ audienceType: v });
    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, { audienceType: v }),
    }));
    profileSaved(v === "b2b" ? "Audience: businesses" : "Audience: consumers");
    // Next: describe who you serve more specifically (open text).
    setStep(1);
  };
  const handleChallenge = (v: string) => {
    setChallengeType(v);
    const summary = challengeOptions.find((o) => o.value === v)?.summary ?? "";
    const label = challengeOptions.find((o) => o.value === v)?.label ?? v;
    persistFoundation({ challengeType: v, desiredOutcome: summary } as Partial<SetupData>);
    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, {
        challengeType: normalizeChallengeType(v),
        desiredOutcome: summary,
      }),
    }));
    profileSaved(`Challenge type: ${label}`);
    setStep6Phase(saved?.topicHint ? "input" : "intro");
    setStep(6);
  };
  const handleTopicNext = () => {
    if (!topicHint.trim()) return;
    persistFoundation({ topicHint: topicHint.trim() } as Partial<SetupData>);
    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, { topic: topicHint.trim() }),
    }));
    profileSaved("Client avatar saved");
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
      desiredOutcome: outcome.trim() || topicHint.trim(),
      problem: problem.trim(),
      audience: audience.trim(),
      how: how.trim(),
      outcome: outcome.trim(),
    };
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(data)); } catch {}

    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, {
        name: prev.user?.name || prev.memory.name,
        audienceType,
        challengeType: normalizeChallengeType(challengeType),
        desiredOutcome: outcome || topicHint || how,
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
    profileSaved("Challenge direction confirmed");
    pushNotification({
      title: "Dashboard updated",
      message: "Your dashboard now reflects your latest challenge answers.",
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
      desiredOutcome: outcome.trim() || topicHint.trim(),
      problem: problem.trim(),
      audience: audience.trim(),
      how: how.trim(),
      outcome: outcome.trim(),
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

        <DayVideoModal dayNum={1} />

        {step !== 4 && step !== 8 && step !== 0 && (
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {step === 1 && (() => {
          const step1Message =
            audienceType === "b2b"
              ? `Got it${fn}. Describe the specific type of business or professional you work with.`
              : audienceType === "b2c"
                ? `Got it${fn}. Describe the specific type of person you work with.`
                : `Got it${fn}. Describe who you serve.`;

          return (
            <div className="space-y-6 animate-fade-in">
              {step1Phase === "intro" && (
                <TypedSequence
                  resetKey="step1-intro"
                  messages={[step1Message]}
                  skipMakingNotes
                  onComplete={() => setStep1Phase("input")}
                />
              )}

              {step1Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={[step1Message]} />
                  <RevealControls className="space-y-5">
                    <div className="space-y-2">
                      <DictatedTextarea
                        autoFocus
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder={
                          audienceType === "b2b"
                            ? "e.g. Independent coaches and consultants, 0–12 months in, who have expertise but no offer."
                            : "e.g. New parents in their 30s who want to build healthier daily habits."
                        }
                        rows={5}
                        className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFoundationNext(1);
                        }}
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={() => handleFoundationNext(1)}
                      disabled={!audience.trim()}
                      className="w-full h-12 text-base font-semibold"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}

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

          const step2Messages = [
            "Now tell me about the problem or obstacle they're trying to overcome.",
          ];

          return (
            <div className="space-y-6 animate-fade-in">
              {step2Phase === "intro" && (
                <TypedSequence
                  resetKey="step2-intro"
                  messages={step2Messages}
                  onComplete={() => setStep2Phase("input")}
                />
              )}

              {step2Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={step2Messages} />
                  <RevealControls className="space-y-5">
                    <div className="space-y-2">
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
                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}

        {step === 3 && (() => {
          const processPlaceholderMap: Record<string, string> = {
            "b2b|solve-problem": "e.g. I diagnose where leads are leaking, then walk them through a 3-step system to fix it.",
            "b2b|quick-win": "e.g. I help them craft a single outreach asset and ship it within 48 hours.",
            "b2b|create-asset": "e.g. I guide them to define their offer, then build a one-page sales asset they can use immediately.",
            "b2b|reach-milestone": "e.g. I break the milestone into 3 weekly sprints with a checkpoint at the end of each.",
            "b2c|solve-problem": "e.g. I help them identify what's blocking them, then rebuild the habit one micro-step at a time.",
            "b2c|quick-win": "e.g. I give them a single daily action they can complete in under 10 minutes.",
            "b2c|create-asset": "e.g. I walk them through a simple template and help them adapt it to their life.",
            "b2c|reach-milestone": "e.g. I break the goal into weekly targets and coach them through one focus area each week.",
          };
          const processPlaceholder =
            processPlaceholderMap[`${audienceType}|${challengeType}`] ??
            "e.g. Describe the steps, framework, or method you take them through to create the result.";

          const step3Messages = [
            "Now describe your process — how you take them through it and create the result.",
          ];

          return (
            <div className="space-y-6 animate-fade-in">
              {step3Phase === "intro" && (
                <TypedSequence
                  resetKey="step3-intro"
                  messages={step3Messages}
                  onComplete={() => setStep3Phase("input")}
                />
              )}

              {step3Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={step3Messages} />
                  <RevealControls className="space-y-5">
                    <div className="space-y-2">
                      <DictatedTextarea
                        autoFocus
                        value={how}
                        onChange={(e) => setHow(e.target.value)}
                        placeholder={processPlaceholder}
                        rows={5}
                        className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFoundationNext(3);
                        }}
                      />
                      
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
                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}

        {step === 9 && (() => {
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

          const step9Messages = [
            "Finally, describe the result they'll experience by the end of your challenge.",
          ];

          return (
            <div className="space-y-6 animate-fade-in">
              {step9Phase === "intro" && (
                <TypedSequence
                  resetKey="step9-intro"
                  messages={step9Messages}
                  onComplete={() => setStep9Phase("input")}
                />
              )}

              {step9Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={step9Messages} />
                  <RevealControls className="space-y-5">
                    <div className="space-y-2">
                      <DictatedTextarea
                        autoFocus
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        placeholder={outcomePlaceholder}
                        rows={5}
                        className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleOutcomeNext();
                        }}
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={handleOutcomeNext}
                      disabled={!outcome.trim()}
                      className="w-full h-12 text-base font-semibold"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}


        {step === 4 && (() => {
          const knownLabel =
            memoryAudienceType === "b2b"
              ? "businesses and professionals"
              : memoryAudienceType === "b2c"
                ? "individuals and consumers"
                : null;
          const step4Messages = knownLabel
            ? [
                `Hi ${firstName}, you previously said you want to help ${knownLabel}.`,
                "Confirm your audience to continue — you can change it here if you'd like.",
              ]
            : [
                `Hi ${firstName}, let's start by identifying who you want to help.`,
              ];
          return (
          <div className="space-y-3 animate-fade-in">
            {step4Phase === "intro" && (
              <TypedSequence
                resetKey="step4-intro"
                messages={step4Messages}
                skipMakingNotes
                onComplete={() => setStep4Phase("choose")}
              />
            )}

            {step4Phase === "choose" && (
              <div className="space-y-3">
                <StaticAi messages={step4Messages} />
                <RevealControls role="radiogroup" aria-label="Audience" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {[
                    {
                      value: "b2b" as const,
                      emoji: "🏢",
                      label: "Business & Professionals",
                      description: "Help businesses, teams, or experts get a result.",
                    },
                    {
                      value: "b2c" as const,
                      emoji: "👥",
                      label: "Individuals & Consumers",
                      description: "Help people improve an area of their life.",
                    },
                  ].map((opt) => {
                    const selected = audienceType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleAudience(opt.value)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                          selected ? "border-primary bg-primary/10" : "border-border bg-card"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? "border-primary" : "border-muted-foreground/40"
                          }`}
                          aria-hidden
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-base font-semibold leading-tight">
                            <span className="mr-1.5">{opt.emoji}</span>
                            {opt.label}
                          </span>
                          <span className="text-sm text-muted-foreground leading-snug">
                            {opt.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </RevealControls>
              </div>
            )}
          </div>
          );
        })()}

        {step === 5 && (() => {
          const step5Messages = [
            `Great${fn} — that's a clear audience. Now, what result do you want them to achieve?`,
          ];
          return (
          <div className="space-y-3 animate-fade-in">
            {step5Phase === "intro" && (
              <TypedSequence
                resetKey={`step5-intro-${audienceType}`}
                messages={step5Messages}
                skipMakingNotes
                onComplete={() => setStep5Phase("choose")}
              />
            )}

            {step5Phase === "choose" && (
              <div className="space-y-3">
                <StaticAi messages={step5Messages} />
                <RevealControls className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {challengeOptions.map((opt) => {
                    const selected = challengeType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleChallenge(opt.value)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                          selected ? "border-primary bg-primary/10" : "border-border bg-card"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? "border-primary" : "border-muted-foreground/40"
                          }`}
                          aria-hidden
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-base font-semibold leading-tight">
                            <span className="mr-1.5">{opt.emoji}</span>
                            {opt.label}
                          </span>
                          <span className="text-sm text-muted-foreground leading-snug">
                            {opt.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </RevealControls>
              </div>
            )}
          </div>
          );
        })()}

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
            `Perfect${fn}. I can already see who this challenge is designed for.`,
            "That's helpful. Let's build on that.",
            "Great. The audience is becoming much clearer.",
          ];
          const feedback = wordCount >= 4 ? feedbackPool[Math.min(Math.floor(wordCount / 6), feedbackPool.length - 1)] : null;

          const audienceNoun = audienceType === "b2b" ? "businesses" : "people";
          const step6Messages = [
            `You're helping ${audienceNoun} ${(challengeLabel(challengeType) || "").toLowerCase()} — tell me about them in detail.`,
          ];

          return (
            <div className="space-y-6 animate-fade-in">
              {step6Phase === "intro" && (
                <TypedSequence
                  resetKey={`step6-intro-${challengeType}`}
                  messages={step6Messages}
                  onComplete={() => setStep6Phase("input")}
                />
              )}

              {step6Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={step6Messages} />
                  <RevealControls className="space-y-5">
                    <div className="space-y-2">
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
                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}

        {step === 7 && audienceType && (() => {
          // Strip leading filler so the words compose inside a sentence.
          const strip = (s: string) =>
            s.replace(/^they(['’]ll| will)?\s+/i, "").replace(/^\s*/, "").replace(/\.$/, "");

          // "Who you help" lives in topicHint (step 6 in the AI-led flow) but falls
          // back to `audience` (step 1 foundation flow) so the summary never breaks.
          const whoRaw = (topicHint?.trim() || audience?.trim() || "");
          const painRaw = problem?.trim() || "";
          const resultRaw = outcome?.trim() || how?.trim() || "";

          const who = whoRaw ? strip(whoRaw) : "";
          const pain = painRaw ? strip(painRaw).toLowerCase() : "";
          const result = resultRaw ? strip(resultRaw).toLowerCase() : "";

          const methodMap: Record<string, string> = {
            "solve-problem": "a focused, problem-solving structure that removes what's holding them back",
            "quick-win": "a fast, action-led plan that delivers a meaningful win in just a few days",
            "create-asset": "a build-as-you-go process that leaves them with something valuable they can keep using",
            "reach-milestone": "a step-by-step path that moves them closer to a milestone that genuinely matters",
          };
          const methodPhrase = challengeType
            ? (methodMap[challengeType] ?? "a clear, day-by-day structure")
            : "";

          const promise = who && pain && result && methodPhrase
            ? `Help ${who} move from ${pain} to ${result} through ${methodPhrase}.`
            : null;

          // Highlight helper for the static reveal — renders the user-derived
          // value in bold brand accent inside the surrounding sentence.
          const hl = (v: string) => (
            <span className="font-semibold text-primary">{v}</span>
          );

          // Plain-text sentences used during typing. Missing fields are skipped
          // so we never display "You want to help ." or similar broken copy.
          const intro = `${Fn ? `${Fn}based` : "Based"} on everything you've shared, a clear picture is starting to emerge.`;
          const closing = `That's what makes this challenge valuable. It creates a clear path from where they are today to where they want to be.`;

          const summary: string[] = [
            intro,
            who ? `You want to help ${who}.` : null,
            pain ? `Right now, they're struggling because ${pain}.` : null,
            result ? `By the end of this challenge, they'll have ${result}.` : null,
            methodPhrase ? `You'll guide them through ${methodPhrase} to help them achieve that result.` : null,
            closing,
          ].filter((line): line is string => Boolean(line));

          // Same sentences as React nodes with highlighted user values for the
          // static reveal phase.
          const summaryNodes: React.ReactNode[] = [
            <>{intro}</>,
            who ? <>You want to help {hl(who)}.</> : null,
            pain ? <>Right now, they're struggling because {hl(pain)}.</> : null,
            result ? <>By the end of this challenge, they'll have {hl(result)}.</> : null,
            methodPhrase ? <>You'll guide them through {hl(methodPhrase)} to help them achieve that result.</> : null,
            <>{closing}</>,
          ].filter(Boolean) as React.ReactNode[];

          return (
            <div className="space-y-6 animate-fade-in">
              {step7Phase === "intro" && (
                <TypedSequence
                  resetKey={`step7-summary-${audienceType}-${challengeType}-${who.length}-${pain.length}-${result.length}`}
                  messages={summary}
                  onComplete={() => setStep7Phase("reveal")}
                />
              )}

              {step7Phase === "reveal" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Render the full summary statically once typing finishes */}
                  <div className="flex items-start gap-3">
                    <JohnnyAvatar />
                    <div className="flex-1 space-y-3 min-w-0 text-sm md:text-base leading-relaxed text-foreground">
                      {summaryNodes.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>

                  <RevealControls className="space-y-6">
                    {/* Challenge Promise */}
                    {promise && (
                      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-6 md:p-8 shadow-lg ml-0 md:ml-10">
                        <Quote className="absolute top-4 right-4 h-10 w-10 text-primary/15" />
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Challenge Promise</p>
                          <p className="text-xl md:text-2xl font-semibold leading-snug text-foreground">
                            Help {hl(who)} move from {hl(pain)} to {hl(result)} through {hl(methodPhrase)}.
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      size="lg"
                      onClick={handleSaveAssessment}
                      className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      Continue Building Your Challenge
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    {isDay1ResetOpen(state.challenge?.startedAt) ? (
                      <div className="flex flex-col items-center gap-1.5 pt-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                              <RotateCcw className="h-3 w-3" />
                              Start Day 1 again
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Start Day 1 again?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This clears your Day 1 answers, AI outputs, and progress so you can
                                start the questions from scratch. Your referrals, points, and other
                                progress are kept.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetDay1}>
                                Start Day 1 again
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <p className="text-[11px] text-muted-foreground text-center max-w-sm">
                          If you need to start over, you can reset Day 1 within 24 hours of starting. Use this only if you want to change your answers.
                        </p>
                      </div>
                    ) : (
                      <p className="pt-2 text-[11px] text-muted-foreground text-center max-w-sm mx-auto">
                        Your Challenge Promise is now locked. To change your answers, upgrade to Lifetime Challenge Access.
                      </p>
                    )}
                  </RevealControls>
                </div>
              )}

            </div>
          );
        })()}


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
            <RevealControls className="pt-2">
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
            </RevealControls>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day1Setup;
