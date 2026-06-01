import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, User as UserIcon, Zap, Sparkles, GraduationCap, Rocket, ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2, Users, AlertCircle, Target, Quote, Compass, RotateCcw, Pencil, Check, X as XIcon } from "lucide-react";
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
import { tidyPhrase, getTidiedSync } from "@/lib/tidyPhrase";
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

// ---------------------------------------------------------------------------
// Echo system — lets Johnny's messages reference the user's prior answers as
// bold/accent inline spans with a tiny pencil-to-edit affordance.
// ---------------------------------------------------------------------------

export type EchoField = "audience" | "how" | "problem" | "outcome" | "topic" | "audienceType" | "challengeType" | "superpower";
export type EchoSegment = { echo: EchoField };
export type MsgSegment = string | EchoSegment;
export type Msg = string | MsgSegment[];

export type EchoMap = Partial<
  Record<
    EchoField,
    {
      value: string;
      onSave?: (v: string) => void;
      format?: (v: string) => string;
      skipTidy?: boolean;
    }
  >
>;

// Normalise a freeform list answer (e.g. "speakers trainers, authors and coaches")
// into a tidy, punctuated list ("speakers, trainers, authors, and coaches").
// Falls back to the original string when the input looks like a sentence.
export const formatList = (raw: string): string => {
  const cleaned = (raw || "").trim().replace(/[.!?,]+$/, "");
  if (!cleaned) return "";
  // Sentences pass through unchanged — only operate on short list-style input.
  if (cleaned.length > 80) return cleaned;
  // Only treat as a list if the input contains explicit list delimiters.
  // (Single spaces are part of a phrase — never a list separator.)
  if (!/,|\/| and | & /i.test(cleaned)) return cleaned;
  const parts = cleaned
    .split(/\s*,\s*|\s*\/\s*|\s+and\s+|\s+&\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return cleaned;
  // Dedupe case-insensitively, preserve order.
  const seen = new Set<string>();
  const unique = parts.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
};

const echoText = (field: EchoField, map?: EchoMap): string => {
  const entry = map?.[field];
  if (!entry) return "";
  const fmt = entry.format ?? formatList;
  return fmt(entry.value || "");
};

// Bold/accent inline echo with an optional pencil edit affordance.
const EchoText = ({
  value,
  format,
  onSave,
  tidyContext,
  skipTidy = false,
}: {
  value: string;
  format?: (v: string) => string;
  onSave?: (v: string) => void;
  tidyContext?: string;
  skipTidy?: boolean;
}) => {
  const formatted = (format ?? formatList)(value || "");
  // Lightly grammar-clean the echoed fragment via AI (cached). Show the raw
  // formatted version immediately, then swap in the tidied version when it
  // arrives so the UI never blocks.
  const cachedTidy = skipTidy ? null : getTidiedSync(formatted, tidyContext);
  const [display, setDisplay] = useState<string>(cachedTidy ?? formatted);
  useEffect(() => {
    let cancelled = false;
    if (!formatted) {
      setDisplay("");
      return;
    }
    if (skipTidy) {
      setDisplay(formatted);
      return;
    }
    const cached = getTidiedSync(formatted, tidyContext);
    if (cached !== null) {
      setDisplay(cached);
      return;
    }
    setDisplay(formatted);
    tidyPhrase(formatted, tidyContext).then((cleaned) => {
      if (!cancelled) setDisplay(cleaned);
    });
    return () => {
      cancelled = true;
    };
  }, [formatted, tidyContext, skipTidy]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (!display) return null;
  if (!onSave) {
    return <span className="font-semibold text-primary">{display}</span>;
  }

  if (editing) {
    const commit = () => {
      const next = draft.trim();
      if (next && next !== value) onSave(next);
      setEditing(false);
    };
    return (
      <span className="inline-flex items-center gap-1 align-middle">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraft(value);
              setEditing(false);
            }
          }}
          className="font-semibold text-primary bg-transparent border-b border-primary/60 focus:outline-none focus:border-primary px-0.5 min-w-[6ch]"
          style={{ width: `${Math.max(draft.length + 1, 6)}ch` }}
        />
        <button
          type="button"
          onClick={commit}
          aria-label="Save"
          className="text-primary hover:text-primary/80"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          aria-label="Cancel"
          className="text-muted-foreground hover:text-foreground"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 align-middle group">
      <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/30 group-hover:decoration-primary/60 transition-all cursor-pointer">
        {display}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit"
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </span>
  );
};

// Render a Msg as React nodes, substituting EchoText for echo segments.
const renderMsg = (msg: Msg, echoMap?: EchoMap, keyPrefix = ""): React.ReactNode => {
  if (typeof msg === "string") return msg;
  return msg.map((seg, i) => {
    if (typeof seg === "string") return <span key={`${keyPrefix}s${i}`}>{seg}</span>;
    const entry = echoMap?.[seg.echo];
    if (!entry) return null;
    return (
      <EchoText
        key={`${keyPrefix}e${i}`}
        value={entry.value}
        format={entry.format}
        onSave={entry.onSave}
        tidyContext={seg.echo}
        skipTidy={entry.skipTidy}
      />
    );
  });
};

// Flatten a Msg to a plain string for typing animation / placeholders.
const flattenMsg = (msg: Msg, echoMap?: EchoMap): string => {
  if (typeof msg === "string") return msg;
  return msg
    .map((seg) => (typeof seg === "string" ? seg : echoText(seg.echo, echoMap)))
    .join("");
};

// Static rendering of the AI conversation block — used to keep the prior typed
// message visible alongside the response controls (matches the look of
// TypedSequence after typing has finished).
const StaticAi = ({ messages, echoMap }: { messages: Msg[]; echoMap?: EchoMap }) => (
  <div className="flex items-start gap-3">
    <JohnnyAvatar />
    <div className="flex-1 space-y-1.5 min-w-0">
      {messages.map((m, i) => (
        <div key={i} className="flex">
          <div className="max-w-[90%] px-1 py-0.5 text-sm md:text-base leading-snug">
            {renderMsg(m, echoMap, `m${i}-`)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// A compact recap of values the user has already given — used between an
// acknowledgement and a follow-up question so we never have to glue multiple
// user fragments into one long sentence.
type RecapRow = { label: string; echo: EchoField };

const sentenceCase = (s: string) => {
  const trimmed = (s || "").trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const isPluralValue = (s: string) => /,|\s(and|&|\+|\/)\s/i.test((s || "").trim());

const audienceLabel = (value: string) =>
  isPluralValue(value) ? "Your audience are:" : "Your audience is:";


const RecapCard = ({ rows, echoMap }: { rows: RecapRow[]; echoMap: EchoMap }) => {
  const visible = rows.filter((r) => {
    const entry = echoMap[r.echo];
    return entry && (entry.value ?? "").trim().length > 0;
  });
  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 space-y-1.5">
      {visible.map((r) => {
        const entry = echoMap[r.echo]!;
        const wrappedFormat = (v: string) => {
          const formatted = entry.format ? entry.format(v) : v;
          return sentenceCase(formatted);
        };
        return (
          <div
            key={r.echo}
            className="text-sm md:text-base leading-snug text-foreground/80"
          >
            <span>{r.label} </span>
            <EchoText
              value={entry.value}
              format={wrappedFormat}
              onSave={entry.onSave}
              tidyContext={r.echo}
              skipTidy={entry.skipTidy}
            />
          </div>
        );
      })}
    </div>
  );
};


// Acknowledgement + recap + question, in Johnny's bubble. Used wherever a
// step's message would otherwise glue two or more echoes into one sentence.
const JohnnyRecapPanel = ({
  leadIn,
  acknowledgement,
  rows,
  question,
  echoMap,
}: {
  leadIn?: string;
  acknowledgement: string;
  rows: RecapRow[];
  question: string;
  echoMap: EchoMap;
}) => (
  <div className="flex items-start gap-3">
    <JohnnyAvatar />
    <div className="flex-1 space-y-3 min-w-0">
      {leadIn && (
        <div className="text-sm md:text-base leading-relaxed text-foreground/80">
          {leadIn}
        </div>
      )}
      <div className="text-sm md:text-base leading-relaxed font-medium">
        {acknowledgement}
      </div>
      <RecapCard rows={rows} echoMap={echoMap} />
      <div className="text-sm md:text-base leading-relaxed">{question}</div>
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
  echoMap,
}: {
  messages: Msg[];
  onComplete?: () => void;
  resetKey: string | number;
  skipMakingNotes?: boolean;
  echoMap?: EchoMap;
}) => {
  // Flatten for typing — we type plain text, then swap to rich render when each
  // message lands in `shown`.
  const plain = messages.map((m) => flattenMsg(m, echoMap));
  const [shown, setShown] = useState<number[]>([]);
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
    if (idx >= plain.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        const last = plain[plain.length - 1] ?? "";
        const finalPause = last.length > 60 ? 1300 : last.length > 30 ? 1000 : 800;
        const t = setTimeout(() => onComplete?.(), finalPause);
        return () => clearTimeout(t);
      }
      return;
    }
    const full = plain[idx];
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
          const betweenPause = full.length > 60 ? 1100 : full.length > 30 ? 850 : 650;
          setTimeout(() => {
            setShown((prev) => [...prev, idx]);
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
        {shown.map((shownIdx, i) => (
          <div key={i} className="flex animate-fade-in">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm md:text-base leading-relaxed">
              {renderMsg(messages[shownIdx], echoMap, `t${shownIdx}-`)}
            </div>
          </div>
        ))}
        {idx < plain.length && (
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

export const SETUP_KEY = "leadio_day1_setup";
const DAY1_STEP_KEY = "leadio_day1_step";
// Legacy key (pre-refactor); read for back-compat so users mid-flow don't lose state.
const LEGACY_SETUP_KEY = "leadio_setup";

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
  superpower?: string;
}

/** Read the wizard draft. DB (aiOutputs.day1Setup) wins; localStorage is pre-auth fallback. */
const readSetupRaw = (aiOutputs?: Record<string, unknown>): any => {
  try {
    const fromDb = aiOutputs?.day1Setup;
    if (fromDb && typeof fromDb === "string") return JSON.parse(fromDb);
    if (fromDb && typeof fromDb === "object") return fromDb;
  } catch {}
  try {
    const raw = localStorage.getItem(SETUP_KEY) || localStorage.getItem(LEGACY_SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getSetup = (): SetupData | null => {
  // Backwards-compatible: used by callers outside the component that don't have state.
  const parsed = readSetupRaw();
  return parsed?.completed ? parsed : null;
};


interface Props {
  onComplete: (data: SetupData) => void;
}

// Sequence: 4 audience-type → 1 who you serve → 10 superpower → 5 result type → 6 avatar detail
// → 2 problem → 3 process → 9 result → 7 promise → 8 AI builder.
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const audienceOptions = [
  { value: "b2b" as const, label: "Businesses / Professionals", icon: Briefcase },
  { value: "b2c" as const, label: "Individuals / Consumers", icon: UserIcon },
];

const challengeOptions = [
  {
    value: "solve-problem",
    description: "Overcome a specific blocker",
  },
  {
    value: "quick-win",
    description: "Deliver a meaningful result fast",
  },
  {
    value: "create-asset",
    description: "Build something they keep using",
  },
  {
    value: "reach-milestone",
    description: "Progress toward an important goal",
  },
];

const challengeLabel = (v: string) =>
  challengeOptions.find((o) => o.value === v)?.description ?? v;

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

  // Source of truth: state.challenge.aiOutputs.day1Setup (DB-synced).
  // localStorage is kept ONLY as a pre-auth fallback so anonymous users can
  // resume mid-flow. Anything we write here is also pushed into aiOutputs.
  const initialAiOutputs = state.challenge?.aiOutputs as Record<string, unknown> | undefined;

  const persistedStepValue = (() => {
    const fromDb = initialAiOutputs?.day1Step;
    if (typeof fromDb === "number") return fromDb;
    if (typeof fromDb === "string" && fromDb !== "") {
      const n = Number(fromDb);
      if (!Number.isNaN(n)) return n;
    }
    try {
      const raw = localStorage.getItem(DAY1_STEP_KEY);
      return raw ? Number(raw) : 0;
    } catch { return 0; }
  })() as Step;

  const handleResetDay1 = () => {
    try {
      localStorage.removeItem(SETUP_KEY);
      localStorage.removeItem(LEGACY_SETUP_KEY);
      localStorage.setItem(DAY1_STEP_KEY, "4");
    } catch {}
    setState((prev) => {
      const aiOutputs = Object.fromEntries(
        Object.entries(prev.challenge.aiOutputs ?? {}).filter(
          ([k]) => !k.startsWith("day1_") && k !== "day1Setup" && k !== "day1Step",
        ),
      );
      aiOutputs.day1Step = "4" as any;
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

  // Restore prior in-progress assessment from saved setup + persisted step.
  const saved = readSetupRaw(initialAiOutputs);
  const persistedStep = persistedStepValue;
  const hasFoundation = !!(saved?.problem && saved?.audience && saved?.how);

  // Audience type must always be picked explicitly on this step.
  // Never pre-select from memory, quiz, or prior saved value.
  const knownAudienceType: "b2b" | "b2c" | null = null;


  const initialStep: Step = (() => {
    if (persistedStep === 1 || persistedStep === 2 || persistedStep === 3 || persistedStep === 9 || persistedStep === 10 || (persistedStep >= 4 && persistedStep <= 8)) return persistedStep as Step;
    return 4;
  })();


  const [step, setStep] = useState<Step>(initialStep);

  // Conversational sub-phases for the AI-led steps.
  type ConvPhase = "intro" | "choose" | "ack";
  const [step4Phase, setStep4Phase] = useState<ConvPhase>(saved?.audienceType ? "choose" : "intro");
  const [step5Phase, setStep5Phase] = useState<ConvPhase>(saved?.challengeType ? "choose" : "intro");
  const [step6Phase, setStep6Phase] = useState<"intro" | "input">(saved?.topicHint ? "input" : "intro");
  const [step1Phase, setStep1Phase] = useState<"intro" | "input">(saved?.audience ? "input" : "intro");
  const [step10Phase, setStep10Phase] = useState<"intro" | "input">(saved?.superpower ? "input" : "intro");
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
  const [superpower, setSuperpower] = useState<string>(saved?.superpower ?? "");

  // Refinement answers
  const [audienceType, setAudienceType] = useState<"b2b" | "b2c" | null>(knownAudienceType);
  const [challengeType, setChallengeType] = useState<string>("");
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
    // Persist current step into challenge_progress.ai_outputs (DB-synced) so
    // refreshing on another device keeps the wizard at the same step.
    if (authUser) {
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: { ...prev.challenge.aiOutputs, day1Step: String(step) },
        },
      }));
    }
  }, [step, authUser, setState]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [builderHistory, builderLoading]);

  // Audience type is only set when the user explicitly picks a card on this step.
  // Do NOT auto-fill from memory/quiz — the user must actively choose.

  const advance = (next: Step) => setTimeout(() => setStep(next), 250);

  // Sequence: 4 → 1 → 10 → 5 → 6 → 2 → 3 → 9 → 7 → 8.
  const goBack = () => {
    const baseMap: Record<number, Step> = { 1: 4, 10: 1, 5: 10, 6: 5, 2: 6, 3: 2, 9: 3, 7: 9 };
    const prev = baseMap[step as number];
    if (prev !== undefined) setStep(prev);
  };
  // Persist foundation answers progressively so refresh doesn't wipe them.
  // Writes to BOTH localStorage (pre-auth fallback) and
  // challenge_progress.ai_outputs.day1Setup (DB-synced source of truth).
  const persistFoundation = (patch: Partial<SetupData>) => {
    try {
      const current = JSON.parse(localStorage.getItem(SETUP_KEY) || localStorage.getItem(LEGACY_SETUP_KEY) || "{}");
      const merged = { ...current, ...patch };
      localStorage.setItem(SETUP_KEY, JSON.stringify(merged));
      if (authUser) {
        setState((prev) => {
          let existing: any = {};
          try {
            const fromState = prev.challenge.aiOutputs?.day1Setup;
            if (typeof fromState === "string") existing = JSON.parse(fromState);
            else if (fromState && typeof fromState === "object") existing = fromState;
          } catch {}
          return {
            ...prev,
            challenge: {
              ...prev.challenge,
              aiOutputs: {
                ...prev.challenge.aiOutputs,
                day1Setup: JSON.stringify({ ...existing, ...patch }),
              },
            },
          };
        });
      }
    } catch {}
  };



  // Top-right confirmation that the latest answer has been written to the
  // user's dashboard (memory auto-syncs to user_memory via useSupabaseSync).
  const profileSaved = (label: string) => {
    window.dispatchEvent(new CustomEvent("dashboard-flash"));
    toast.success("Your dashboard is updated", {
      description: label,
      position: "top-left",
      duration: 3500,
      className: "lg:!ml-[280px]",
      action: {
        label: "Dashboard",
        onClick: () => navigate("/challenger-dashboard"),
      },
    });
  };

  // ----- AI threading (Lovable AI Gateway via day1-thread edge function) -----
  // We fire AI calls at two key moments: after the problem (step 2 → 3) and at
  // the Challenge Promise (step 9 → 7). Both calls cache into aiOutputs keyed
  // by a hash of the inputs so back/forward navigation never re-bills.
  // Both calls are best-effort with a short navigation wait — if the AI is
  // slow or unavailable, we fall back to the template copy and the user never
  // sees a hung button.

  const [navLoading, setNavLoading] = useState<null | "problem" | "outcome">(null);
  // Snapshot AI outputs at step entry so the TypedSequence doesn't restart
  // mid-typing if the cache updates later in the same visit.
  const [step3Reaction, setStep3Reaction] = useState<string | null>(null);
  const [step7Promise, setStep7Promise] = useState<{ summary: string[]; promise: string } | null>(null);

  useEffect(() => {
    if (step !== 3) return;
    const cached = state.challenge?.aiOutputs?.day1_problem_reaction;
    setStep3Reaction(typeof cached === "string" && cached.trim() ? cached.trim() : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== 7) return;
    const raw = state.challenge?.aiOutputs?.day1_promise;
    if (typeof raw === "string" && raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.summary) && typeof parsed.promise === "string") {
          setStep7Promise({ summary: parsed.summary, promise: parsed.promise });
          return;
        }
      } catch {
        /* fall through to null */
      }
    }
    setStep7Promise(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const ensureProblemReaction = async (): Promise<void> => {
    const cacheKey = `${audience.trim()}|${problem.trim()}`;
    const cachedKey = state.challenge?.aiOutputs?.day1_problem_reaction_key as string | undefined;
    const cached = state.challenge?.aiOutputs?.day1_problem_reaction as string | undefined;
    if (cached && cachedKey === cacheKey) return;
    try {
      const { data, error } = await supabase.functions.invoke("day1-thread", {
        body: {
          moment: "problem-reaction",
          inputs: { firstName, audience: audience.trim(), problem: problem.trim() },
        },
      });
      if (error || !data || (data as any).fallback) return;
      const text = (data as any).text;
      if (typeof text !== "string" || !text.trim()) return;
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            day1_problem_reaction: text.trim(),
            day1_problem_reaction_key: cacheKey,
          },
        },
      }));
    } catch {
      /* swallow — template fallback in UI */
    }
  };

  const ensurePromise = async (): Promise<void> => {
    const cacheKey = `${audience.trim()}|${superpower.trim()}|${topicHint.trim()}|${problem.trim()}|${how.trim()}|${outcome.trim()}|${challengeType}`;
    const cachedKey = state.challenge?.aiOutputs?.day1_promise_key as string | undefined;
    const cached = state.challenge?.aiOutputs?.day1_promise as string | undefined;
    if (cached && cachedKey === cacheKey) return;
    try {
      const { data, error } = await supabase.functions.invoke("day1-thread", {
        body: {
          moment: "promise",
          inputs: {
            firstName,
            audience: audience.trim(),
            superpower: superpower.trim(),
            topicHint: topicHint.trim(),
            problem: problem.trim(),
            how: how.trim(),
            outcome: outcome.trim(),
            challengeTypeLabel: challengeLabel(challengeType),
          },
        },
      });
      if (error || !data || (data as any).fallback) return;
      const summary = (data as any).summary;
      const promise = (data as any).promise;
      if (!Array.isArray(summary) || typeof promise !== "string" || !promise.trim()) return;
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            day1_promise: JSON.stringify({ summary, promise: promise.trim() }),
            day1_promise_key: cacheKey,
          },
        },
      }));
    } catch {
      /* swallow — template fallback in UI */
    }
  };

  const handleFoundationNext = async (current: 1 | 2 | 3) => {
    if (current === 1) {
      if (!audience.trim()) return;
      persistFoundation({ audience: audience.trim() });
      profileSaved("Who you serve");
      setStep10Phase(saved?.superpower ? "input" : "intro");
      setStep(10);
    } else if (current === 2) {
      if (!problem.trim()) return;
      persistFoundation({ problem: problem.trim() });
      profileSaved("The problem you're solving");
      // Hold briefly while Johnny "reads" the answer. Race the AI call against
      // a 2.2s timeout so a slow/failed model never blocks the flow.
      setNavLoading("problem");
      await Promise.race([
        ensureProblemReaction(),
        new Promise<void>((r) => setTimeout(r, 2200)),
      ]);
      setNavLoading(null);
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

  const handleOutcomeNext = async () => {
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
    // Compose the Challenge Promise via AI. Give it a touch more time than
    // the problem-reaction call since it's structured tool-call output.
    setNavLoading("outcome");
    await Promise.race([
      ensurePromise(),
      new Promise<void>((r) => setTimeout(r, 3000)),
    ]);
    setNavLoading(null);
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
  const handleSuperpowerNext = () => {
    if (!superpower.trim()) return;
    persistFoundation({ superpower: superpower.trim() } as Partial<SetupData>);
    profileSaved("Your superpower");
    setStep5Phase(saved?.challengeType ? "choose" : "intro");
    setStep(5);
  };
  const handleChallenge = (v: string) => {
    setChallengeType(v);
    const description = challengeOptions.find((o) => o.value === v)?.description ?? v;
    persistFoundation({ challengeType: v, desiredOutcome: description } as Partial<SetupData>);
    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, {
        challengeType: normalizeChallengeType(v),
        desiredOutcome: description,
      }),
    }));
    profileSaved(`Challenge type: ${description}`);
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
    profileSaved("Trigger moment saved");
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
      superpower: superpower.trim(),
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
          // Mirror the wizard's full draft into DB-synced aiOutputs so it
          // survives cross-device login.
          day1Setup: JSON.stringify(data),
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
      superpower: superpower.trim(),
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

  // Echo map — wires inline edits on Johnny's reflected snippets back to state
  // and persistence. `format: (v) => v` disables list-formatting for fields
  // that are usually sentences (problem/outcome/how).
  const saveAudience = (v: string) => {
    setAudience(v);
    persistFoundation({ audience: v });
  };
  const saveProblem = (v: string) => {
    setProblem(v);
    persistFoundation({ problem: v });
  };
  const saveHow = (v: string) => {
    setHow(v);
    persistFoundation({ how: v });
  };
  const saveOutcome = (v: string) => {
    setOutcome(v);
    persistFoundation({ outcome: v });
  };
  const saveTopic = (v: string) => {
    setTopicHint(v);
    persistFoundation({ topicHint: v } as Partial<SetupData>);
  };
  const saveSuperpower = (v: string) => {
    setSuperpower(v);
    persistFoundation({ superpower: v } as Partial<SetupData>);
  };
  const audienceTypeLabel =
    audienceType === "b2b"
      ? "business or professional"
      : audienceType === "b2c"
        ? "person"
        : "";

  const echoMap: EchoMap = {
    audience: { value: audience, onSave: saveAudience },
    problem: { value: problem, onSave: saveProblem, format: (v) => v },
    how: { value: how, onSave: saveHow, format: (v) => v },
    outcome: { value: outcome, onSave: saveOutcome, format: (v) => v },
    topic: { value: topicHint, onSave: saveTopic, format: (v) => v },
    superpower: { value: superpower, onSave: saveSuperpower, format: (v) => v },
    audienceType: { value: audienceTypeLabel, format: (v) => v, skipTidy: true },
    challengeType: { value: challengeLabel(challengeType) || "", format: (v) => v.toLowerCase(), skipTidy: true },
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
          const step1Message: Msg = audienceType
            ? [
                `Got it${fn}. Describe the specific type of `,
                { echo: "audienceType" } as MsgSegment,
                ` you work with.`,
              ]
            : `Got it${fn}. Describe who you serve.`;

          return (
            <div className="space-y-6 animate-fade-in">
              {step1Phase === "intro" && (
                <TypedSequence
                  resetKey={`step1-intro-${audienceType ?? "none"}`}
                  messages={[step1Message]}
                  echoMap={echoMap}
                  skipMakingNotes
                  onComplete={() => setStep1Phase("input")}
                />
              )}

              {step1Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={[step1Message]} echoMap={echoMap} />
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

        {step === 10 && (() => {
          const audienceTrim10 = audience.trim().replace(/\.$/, "");
          const step10Message: Msg =
            `So${fn}, what's your superpower? What do you do better than anyone else?`;

          return (
            <div className="space-y-6 animate-fade-in">
              {step10Phase === "intro" && (
                <TypedSequence
                  resetKey={`step10-intro-${audienceTrim10.length}`}
                  messages={[step10Message]}
                  echoMap={echoMap}
                  skipMakingNotes
                  onComplete={() => setStep10Phase("input")}
                />
              )}

              {step10Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={[step10Message]} echoMap={echoMap} />
                  <RevealControls className="space-y-5">
                    <div className="space-y-2">
                      <DictatedTextarea
                        autoFocus
                        value={superpower}
                        onChange={(e) => setSuperpower(e.target.value)}
                        placeholder="e.g. I make complex ideas feel simple and actionable, so people finally take the step they've been avoiding."
                        rows={5}
                        className="min-h-[140px] text-base p-4 pb-12 leading-relaxed"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSuperpowerNext();
                        }}
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={handleSuperpowerNext}
                      disabled={!superpower.trim()}
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
          // Use the user's own audience/avatar words so the example feels relevant to them.
          const whoTrim = topicHint.trim().replace(/\.$/, "");
          const audienceTrim = audience.trim().replace(/\.$/, "");
          const audienceLower = audienceTrim
            ? audienceTrim.charAt(0).toLowerCase() + audienceTrim.slice(1)
            : "";
          const whoLower = whoTrim
            ? whoTrim.charAt(0).toLowerCase() + whoTrim.slice(1)
            : "";
          // Subject embedded into the placeholder — prefer the more specific avatar (topicHint),
          // fall back to the broader audience description, then a generic noun.
          const subject = "they";

          const problemHintByChallenge: Record<string, string> = {
            "quick-win": `e.g. ${subject} feel stuck and need a fast win to rebuild momentum.`,
            "create-asset": `e.g. ${subject} don't have a clear, reusable plan they can follow with confidence.`,
            "reach-milestone": `e.g. ${subject} keep falling short of a goal that genuinely matters to them.`,
          };
          const problemPlaceholder =
            problemHintByChallenge[challengeType] ??
            `e.g. The specific frustration or obstacle holding ${subject} back right now.`;

          const hasSubjectForMsg = Boolean(whoLower || audienceLower);
          const step2Messages: Msg[] = [
            hasSubjectForMsg
              ? [
                  `Got it${fn}. So for `,
                  { echo: whoLower ? "topic" : "audience" } as MsgSegment,
                  ` — what's the specific problem or obstacle they're trying to overcome right now?`,
                ]
              : "Now tell me about the specific problem or obstacle they're trying to overcome.",
          ];


          return (
            <div className="space-y-6 animate-fade-in">
              {step2Phase === "intro" && (
                <TypedSequence
                  resetKey={`step2-intro-${whoTrim.length}-${audienceTrim.length}`}
                  messages={step2Messages}
                  echoMap={echoMap}
                  onComplete={() => setStep2Phase("input")}
                />
              )}


              {step2Phase === "input" && (
                <div className="space-y-5">
                  <StaticAi messages={step2Messages} echoMap={echoMap} />
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
                      disabled={!problem.trim() || navLoading === "problem"}
                      className="w-full h-12 text-base font-semibold"
                    >
                      {navLoading === "problem" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Thinking…
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}

        {step === 3 && (() => {
          const whoTrim3 = topicHint.trim().replace(/\.$/, "");
          const audienceTrim3 = audience.trim().replace(/\.$/, "");
          const audienceLower3 = audienceTrim3
            ? audienceTrim3.charAt(0).toLowerCase() + audienceTrim3.slice(1)
            : "";
          const whoLower3 = whoTrim3
            ? whoTrim3.charAt(0).toLowerCase() + whoTrim3.slice(1)
            : "";
          const painTrim = problem.trim().replace(/\.$/, "").replace(/^\s*/, "");
          const painLower = painTrim ? painTrim.charAt(0).toLowerCase() + painTrim.slice(1) : "";
          const subject3 = "they";

          // Embed the user's audience into the example so it feels like it's about *their* people.
          const processHintByChallenge: Record<string, string> = {
            "solve-problem": `e.g. I help ${subject3} pinpoint what's really blocking them, then walk them through a simple 3-step fix.`,
            "quick-win": `e.g. I give ${subject3} one focused daily action they can complete in under 15 minutes to create momentum.`,
            "create-asset": `e.g. I walk ${subject3} through a template, then help them adapt it to their own situation step by step.`,
            "reach-milestone": `e.g. I break the goal into 3 daily targets and coach ${subject3} through one focus area each day.`,
          };
          const processPlaceholder =
            processHintByChallenge[challengeType] ??
            `e.g. Describe the steps or framework you take ${subject3} through to create the result.`;

          const subjectField3: EchoField | null = whoLower3 ? "topic" : audienceLower3 ? "audience" : null;
          const step3Ack = `That's clear${fn}.`;
          const step3Question =
            subjectField3 || painLower
              ? "What's the process you take them through to create the result?"
              : "Now describe your process — the steps you take them through to create the result.";

          const step3RecapRows: RecapRow[] = [];
          if (subjectField3) {
            step3RecapRows.push({
              label: subjectField3 === "topic" ? "Your challenge will help them with:" : audienceLabel(audienceTrim3),
              echo: subjectField3,
            });
          }
          if (superpower.trim()) step3RecapRows.push({ label: "Your superpower is:", echo: "superpower" });
          if (painLower) step3RecapRows.push({ label: "Their problem is:", echo: "problem" });



          // Typed intro: lead with Johnny's AI reaction (if it landed in time)
          // followed by the short acknowledgement. The recap + question render
          // as structured rows once the typing completes.
          const step3IntroMessages: Msg[] = step3Reaction
            ? [step3Reaction, step3Ack]
            : [step3Ack];

          return (
            <div className="space-y-6 animate-fade-in">
              {step3Phase === "intro" && (
                <TypedSequence
                  resetKey={`step3-intro-${whoTrim3.length}-${painLower.length}-${audienceTrim3.length}`}
                  messages={step3IntroMessages}
                  echoMap={echoMap}
                  onComplete={() => setStep3Phase("input")}
                />
              )}


              {step3Phase === "input" && (
                <div className="space-y-5">
                  <JohnnyRecapPanel
                    leadIn={step3Reaction ?? undefined}
                    acknowledgement={step3Ack}
                    rows={step3RecapRows}
                    question={step3Question}
                    echoMap={echoMap}
                  />
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
          const whoTrim9 = topicHint.trim().replace(/\.$/, "");
          const audienceTrim9 = audience.trim().replace(/\.$/, "");
          const audienceLower9 = audienceTrim9
            ? audienceTrim9.charAt(0).toLowerCase() + audienceTrim9.slice(1)
            : "";
          const whoLower9 = whoTrim9
            ? whoTrim9.charAt(0).toLowerCase() + whoTrim9.slice(1)
            : "";
          const painTrim9 = problem.trim().replace(/\.$/, "");
          const painLower9 = painTrim9 ? painTrim9.charAt(0).toLowerCase() + painTrim9.slice(1) : "";
          const howTrim9 = how.trim().replace(/\.$/, "");
          const howLower9 = howTrim9 ? howTrim9.charAt(0).toLowerCase() + howTrim9.slice(1) : "";
          const subject9 = "they";

          // Placeholder shows the specific transformation arc.
          const outcomeHintByChallenge: Record<string, string> = {
            "solve-problem": `e.g. ${subject9} will move past what's been blocking them and feel back in control.`,
            "quick-win": `e.g. ${subject9} will walk away with a tangible early win that proves what's possible.`,
            "create-asset": `e.g. ${subject9} will leave with a practical tool or plan they can keep using long after Day 3.`,
            "reach-milestone": `e.g. ${subject9} will make real, measurable progress toward a goal that genuinely matters to them.`,
          };
          const outcomePlaceholder =
            outcomeHintByChallenge[challengeType] ??
            `e.g. The transformation ${subject9} will experience by the end of the 3 days.`;

          const subjectField9: EchoField | null = whoLower9 ? "topic" : audienceLower9 ? "audience" : null;
          const step9Ack = `Last one${fn}.`;
          const step9Question =
            subjectField9 || painLower9
              ? "What do they walk away with by the end of Day 3?"
              : "Finally, describe the result they'll walk away with by the end of Day 3.";

          const step9RecapRows: RecapRow[] = [];
          if (subjectField9) {
            step9RecapRows.push({
              label: subjectField9 === "topic" ? "Your challenge will help them with:" : audienceLabel(audienceTrim9),
              echo: subjectField9,
            });
          }
          if (painLower9) step9RecapRows.push({ label: "Their problem is:", echo: "problem" });
          if (howTrim9) step9RecapRows.push({ label: "Your process is:", echo: "how" });



          const step9IntroMessages: Msg[] = [step9Ack];

          return (
            <div className="space-y-6 animate-fade-in">
              {step9Phase === "intro" && (
                <TypedSequence
                  resetKey={`step9-intro-${whoTrim9.length}-${painLower9.length}-${audienceTrim9.length}`}
                  messages={step9IntroMessages}
                  echoMap={echoMap}
                  onComplete={() => setStep9Phase("input")}
                />
              )}


              {step9Phase === "input" && (
                <div className="space-y-5">
                  <JohnnyRecapPanel
                    acknowledgement={step9Ack}
                    rows={step9RecapRows}
                    question={step9Question}
                    echoMap={echoMap}
                  />
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
                      disabled={!outcome.trim() || navLoading === "outcome"}
                      className="w-full h-12 text-base font-semibold"
                    >
                      {navLoading === "outcome" ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Crafting your promise…
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                  </RevealControls>
                </div>
              )}
            </div>
          );
        })()}


        {step === 4 && (() => {
          const step4Messages = [
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
          const audienceTrim5 = audience.trim().replace(/\.$/, "");
          const audienceLower5 = audienceTrim5
            ? audienceTrim5.charAt(0).toLowerCase() + audienceTrim5.slice(1)
            : "";
          const step5Messages: Msg[] = audienceLower5
            ? [
                `Great${fn}.`,
                [
                  `With `,
                  { echo: "audience" } as MsgSegment,
                  ` in mind, what will your 3-day challenge help them achieve?`,
                ],
              ]
            : [
                `Great${fn}.`,
                `What will your 3-day challenge help them achieve?`,
              ];

          return (
          <div className="space-y-3 animate-fade-in">
            {step5Phase === "intro" && (
              <TypedSequence
                resetKey={`step5-intro-${audienceType}-${audienceTrim5.length}`}
                messages={step5Messages}
                echoMap={echoMap}
                skipMakingNotes
                onComplete={() => setStep5Phase("choose")}
              />
            )}

            {step5Phase === "choose" && (
              <div className="space-y-3">
                <StaticAi messages={step5Messages} echoMap={echoMap} />
                <RevealControls className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                  {challengeOptions.map((opt, idx) => {
                    const selected = challengeType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleChallenge(opt.value)}
                        style={{ animationDelay: `${idx * 140}ms`, animationFillMode: "both" }}
                        className={`group relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border text-left opacity-0 animate-fade-in transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/60 active:scale-[0.98] ${
                          selected
                            ? "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-md shadow-primary/10"
                            : "border-border bg-card"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent"
                        />
                        <span
                          className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            selected ? "border-primary scale-110" : "border-muted-foreground/40 group-hover:border-primary/60"
                          }`}
                          aria-hidden
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary animate-scale-in" />}
                        </span>
                        <span className="relative text-base font-semibold leading-tight">
                          {opt.description}
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
          const audienceTrim6 = audience.trim().replace(/\.$/, "");
          const audienceLower6 = audienceTrim6
            ? audienceTrim6.charAt(0).toLowerCase() + audienceTrim6.slice(1)
            : "";
          

          // NEW step 6 = the "trigger moment". We already know WHO from step 1; this
          // captures WHAT'S HAPPENING in their life/business right now that makes the
          // next 3 days the perfect time to take this challenge. Same field
          // (`topicHint`), same position, same scoring — only the meaning changes.
          const placeholderByChallenge: Record<string, string> = {
            "solve-problem": audienceLower6
              ? `e.g. They've just hit the wall again with the same problem, and they're finally ready to admit what they've been doing isn't working.`
              : `e.g. They've just hit the same wall again and they're finally ready to try something different.`,
            "quick-win": audienceLower6
              ? `e.g. They've got a deadline, event, or launch in the next two weeks and they can't keep putting this off.`
              : `e.g. They've got a deadline or event coming up and they can't put this off any longer.`,
            "create-asset": audienceLower6
              ? `e.g. They've decided this is the moment — they're done winging it and want something solid they can keep using.`
              : `e.g. They've decided they're done winging it and want something solid they can keep using.`,
            "reach-milestone": audienceLower6
              ? `e.g. They're close enough to the milestone to taste it but keep stalling at the same point every time.`
              : `e.g. They're close to a milestone that matters but keep stalling at the same point every time.`,
          };
          const placeholder =
            placeholderByChallenge[challengeType] ??
            `e.g. What's happening for them right now that makes the next 3 days the perfect time to do this?`;

          // Single combined Johnny message — reflects what we already know AND
          // asks the trigger-moment question in one beat. Keeping it as one
          // message prevents any chance of duplicate typing and ensures the
          // answer field appears as soon as Johnny finishes.
          const step6Ack = `Great${fn}.`;

          const step6Question =
            "What's happening for them right now that makes your three-day challenge the perfect solution?";

          const step6RecapRows: RecapRow[] = [];
          if (audienceLower6) step6RecapRows.push({ label: audienceLabel(audienceTrim6), echo: "audience" });
          if (challengeType) step6RecapRows.push({ label: "Your goal is:", echo: "challengeType" });



          const step6IntroMessages: Msg[] = [step6Ack];

          return (
            <div className="space-y-6 animate-fade-in">
              {step6Phase === "intro" && (
                <TypedSequence
                  resetKey={`step6-intro-${challengeType}-${audienceTrim6.length}`}
                  messages={step6IntroMessages}
                  echoMap={echoMap}
                  onComplete={() => setStep6Phase("input")}
                />
              )}



              {step6Phase === "input" && (
                <div className="space-y-5">
                  <JohnnyRecapPanel
                    acknowledgement={step6Ack}
                    rows={step6RecapRows}
                    question={step6Question}
                    echoMap={echoMap}
                  />
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
          const resultRaw = outcome?.trim() || "";
          const howRaw = how?.trim() || "";

          const who = whoRaw ? strip(whoRaw) : "";
          const pain = painRaw ? strip(painRaw).toLowerCase() : "";
          const result = resultRaw ? strip(resultRaw).toLowerCase() : "";
          // The user's own process words. Strip a leading "I " so it composes
          // grammatically inside "by [process]" / "through [process]".
          const howClean = howRaw
            ? strip(howRaw).replace(/^I\s+/i, "").toLowerCase()
            : "";

          // Fallback method language by challenge type — only used if the user
          // didn't write a process. Their actual words always win.
          const methodMap: Record<string, string> = {
            "solve-problem": "a focused, problem-solving structure that removes what's holding them back",
            "quick-win": "a fast, action-led plan that delivers a meaningful win in just a few days",
            "create-asset": "a build-as-you-go process that leaves them with something valuable they can keep using",
            "reach-milestone": "a step-by-step path that moves them closer to a milestone that genuinely matters",
          };
          const methodPhrase = howClean
            ? howClean
            : challengeType
              ? (methodMap[challengeType] ?? "a clear, day-by-day structure")
              : "";

          // If the AI composed a Challenge Promise, prefer its wording (it uses
          // the user's literal words and reads natural). Otherwise fall back to
          // the template stitch.
          const templatePromise = who && pain && result && methodPhrase
            ? `Help ${who} move from ${pain} to ${result} by ${methodPhrase}.`
            : null;
          const promise = step7Promise?.promise || templatePromise;

          // Highlight helper for the static reveal — renders the user-derived
          // value in bold brand accent inside the surrounding sentence.
          const hl = (v: string) => (
            <span className="font-semibold text-primary">{v}</span>
          );

          // Plain-text sentences used during typing. Missing fields are skipped
          // so we never display "You want to help ." or similar broken copy.
          const intro = `${Fn ? `${Fn}based` : "Based"} on everything you just told me, here's what your challenge looks like.`;
          const closing = `That's what makes this challenge valuable — a clear path from where they are today to the exact result you've described.`;

          const guideLine = howClean
            ? `You'll guide them by ${howClean}.`
            : methodPhrase
              ? `You'll guide them through ${methodPhrase} to help them achieve that result.`
              : null;
          const guideNode: React.ReactNode = howClean
            ? <>You'll guide them by {hl(howClean)}.</>
            : methodPhrase
              ? <>You'll guide them through {hl(methodPhrase)} to help them achieve that result.</>
              : null;

          const templateSummary: string[] = [
            intro,
            who ? `You're building this for ${who}.` : null,
            pain ? `Right now, they're stuck because ${pain}.` : null,
            result ? `By the end of Day 3, they'll have ${result}.` : null,
            guideLine,
            closing,
          ].filter((line): line is string => Boolean(line));

          // Use the AI summary if available — it weaves the user's words into a
          // single coherent voice instead of stitched template sentences.
          const summary: string[] = step7Promise?.summary?.length
            ? step7Promise.summary
            : templateSummary;

          // For the static reveal, render highlighted nodes only when we have
          // the template (we know where the user values are). For AI summary
          // we render plain paragraphs — the AI already used the user's words.
          const summaryNodes: React.ReactNode[] = step7Promise?.summary?.length
            ? step7Promise.summary.map((s, i) => <span key={i}>{s}</span>)
            : ([
                <>{intro}</>,
                who ? <>You're building this for {hl(who)}.</> : null,
                pain ? <>Right now, they're stuck because {hl(pain)}.</> : null,
                result ? <>By the end of Day 3, they'll have {hl(result)}.</> : null,
                guideNode,
                <>{closing}</>,
              ].filter(Boolean) as React.ReactNode[]);

          return (
            <div className="space-y-6 animate-fade-in">
              {step7Phase === "intro" && (
                <TypedSequence
                  resetKey={`step7-summary-${audienceType}-${challengeType}-${who.length}-${pain.length}-${result.length}-${howClean.length}`}
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
                            Help {hl(who)} move from {hl(pain)} to {hl(result)} by {hl(methodPhrase)}.
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
