import { useEffect, useState } from "react";
import { Briefcase, User as UserIcon, Zap, Sparkles, GraduationCap, Rocket, ArrowRight, ArrowLeft, PlayCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { useAppState } from "@/context/AppContext";
import { mergeMemory, normalizeChallengeType } from "@/lib/personalisation";
import DictateButton from "@/components/DictateButton";
import { useDictation } from "@/hooks/useDictation";

export const SETUP_KEY = "leadio_setup";

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

type Step = 0 | 1 | 2 | 3 | 4;

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

const Day1Setup = ({ onComplete }: Props) => {
  const { state, setState } = useAppState();
  const [step, setStep] = useState<Step>(1);
  const [audienceType, setAudienceType] = useState<"b2b" | "b2c" | null>(null);
  const [challengeType, setChallengeType] = useState<string>("");
  const [topicHint, setTopicHint] = useState<string>("");
  const { isListening: isDictating, toggle: toggleDictation } = useDictation();
  const firstName = state.user?.name?.split(" ")[0] || "";

  useEffect(() => {
    trackEvent("onboarding_viewed", { step });
  }, [step]);

  const advance = (next: Step) => {
    setTimeout(() => setStep(next), 300);
  };

  const handleAudience = (v: "b2b" | "b2c") => {
    setAudienceType(v);
    advance(2);
  };

  const handleChallenge = (v: string) => {
    setChallengeType(v);
    advance(3);
  };

  const handleTopicNext = () => setStep(4);

  const handleStart = () => {
    if (!audienceType || !challengeType) return;
    const data: SetupData = {
      completed: true,
      audienceType,
      challengeType,
      topicHint: topicHint.trim(),
      desiredOutcome: topicHint.trim(),
    };
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(data));
    } catch {}
    setState((prev) => ({
      ...prev,
      memory: mergeMemory(prev.memory, {
        name: prev.user?.name || prev.memory.name,
        audienceType,
        challengeType: normalizeChallengeType(challengeType),
        desiredOutcome: topicHint,
        topic: topicHint,
      }),
    }));
    trackEvent("onboarding_invite_completed", { audienceType, challengeType });
    trackEvent("memory_created", { source: "onboarding" });
    onComplete(data);
  };

  const goBack = () => setStep(((step as number) - 1) as Step);

  return (
    <div className="app-page-container min-h-[80vh] flex items-center justify-center py-8 animate-fade-in">
      <div className="w-full max-w-md md:max-w-4xl">
        {step > 0 && (
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              
              <h1 className="text-3xl font-bold tracking-tight">How this challenge works</h1>
              <p className="text-muted-foreground">Let’s get you set up, {firstName}.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex aspect-video items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PlayCircle className="h-14 w-14" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">The 3-day challenge growth system</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You’re going to build something real over the next 3 days, {firstName}.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Build once", "Create an evergreen challenge that keeps working after the launch."],
                ["Unlock more", "Invite people who join to unlock extra training and rewards."],
                ["Launch fast", `By Day 3, you’ll have a live challenge, ${firstName}.`],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-border bg-card/70 p-4">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={() => setStep(1)} className="w-full h-14 text-base font-semibold">
              Start Day 1
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Let's set this up</h1>
              <p className="text-muted-foreground">Who is your challenge for?</p>
            </div>
            <div className="space-y-3">
              {audienceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAudience(opt.value)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                    audienceType === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
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
              <h2 className="text-2xl font-bold tracking-tight">What result should they get?</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {challengeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChallenge(opt.value)}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] ${
                    challengeType === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
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
              <h2 className="text-2xl font-bold tracking-tight">
                What do you want them to walk away with?
              </h2>
              <p className="text-sm text-muted-foreground">Optional — you can skip this</p>
            </div>
            <div className="relative">
              <Input
                autoFocus
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
                placeholder="e.g. a finished landing page, a clear plan, a launched idea"
                className="h-14 text-base px-4 pr-24"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTopicNext();
                }}
              />
              <DictateButton
                isListening={isDictating}
                onToggle={() => toggleDictation((text) => setTopicHint(text))}
              />
            </div>
            <Button
              size="lg"
              onClick={handleTopicNext}
              className="w-full h-12 text-base font-semibold"
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {step === 4 && audienceType && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Here's what you're building
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                You're building a{" "}
                <span className="text-primary">{challengeLabel(challengeType)}</span> challenge for{" "}
                <span className="text-primary">{audienceLabel(audienceType)}</span>
              </h2>
            </div>
            {topicHint && (
              <div className="p-4 rounded-lg border border-border bg-card/60">
                <p className="text-sm text-muted-foreground">Outcome</p>
                <p className="font-medium mt-1">{topicHint}</p>
              </div>
            )}
            <p className="text-muted-foreground leading-relaxed">
              This will attract the right people and turn them into leads as they go through it.
            </p>
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Start Day 1
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Day1Setup;
