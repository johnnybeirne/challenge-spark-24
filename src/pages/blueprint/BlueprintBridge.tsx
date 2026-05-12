import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  Flame,
  MessageCircle,
  Rocket,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/AppContext";

const READINESS_OPTIONS = [
  "Lead magnet funnel",
  "Referral system",
  "Challenge funnel",
  "Community growth",
  "Waitlist engine",
  "Course funnel",
  "Other",
];

const DAY_PREVIEWS = [
  {
    day: 1,
    eyebrow: "Day 1",
    title: "Structure Your Lead Generation System",
    icon: Target,
    builds: "Your audience snapshot, hook, and challenge structure.",
    ai: "AI helps you draft your audience profile and challenge angle.",
    outcome: "A clear, written foundation you can build on.",
  },
  {
    day: 2,
    eyebrow: "Day 2",
    title: "Build Your Referral & Engagement Engine",
    icon: Users,
    builds: "Your referral links, invite copy, and engagement plan.",
    ai: "AI suggests share copy and identifies your strongest referral angle.",
    outcome: "An engine that turns participants into amplifiers.",
  },
  {
    day: 3,
    eyebrow: "Day 3",
    title: "Launch Your Trust-Based Growth Loop",
    icon: Flame,
    builds: "Your launch URL, public commitment, and Builder Circle entry.",
    ai: "AI reviews your launch and gives you a final implementation pass.",
    outcome: "A live, trust-based growth loop you can share today.",
  },
];

const BlueprintBridge = () => {
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const tasks = state.challenge.tasks;
  const ai = state.challenge.aiOutputs ?? {};

  const modulesCompleted = useMemo(
    () => [1, 2, 3].filter((n) => tasks[`blueprint_lesson_${n}`]).length,
    [tasks]
  );
  const initialIntent = ai.lms_build_intent || "";
  const [intent, setIntent] = useState<string>(initialIntent);

  const startChallenge = () => {
    const stamp = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: {
          ...prev.challenge.aiOutputs,
          entered_challenge_from_lms: "true",
          entered_challenge_from_lms_at: stamp,
          ...(intent ? { lms_build_intent: intent } : {}),
        },
      },
    }));
    navigate("/user-dashboard");
  };

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-10 lg:py-14">
      {/* Energy shift backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-2xl" />

      {/* Eyebrow + completion ribbon */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" /> Foundations Complete
        </span>
        <Badge variant="outline" className="text-[10px]">
          {modulesCompleted}/3 modules done
        </Badge>
      </div>

      <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
        You understand the system. Now build it.
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
        You've learned how trust-based lead generation works. The next step is implementation.
      </p>

      {/* Body copy */}
      <section className="mt-6 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:p-8 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">The free course</p>
          <h2 className="mt-1 text-lg font-black">Learn the system</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            The Leadio Course helped you understand why referrals, trust, and challenge-based engagement
            outperform traditional lead generation.
          </p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">The 3-day challenge</p>
          <h2 className="mt-1 text-lg font-black">Implement the system</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            The 3-Day Challenge is where you build your own system using AI-guided implementation, referrals,
            and momentum-based execution.
          </p>
        </div>
      </section>

      {/* Day previews */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wide text-primary">Your 3-Day Implementation Path</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {DAY_PREVIEWS.map(({ day, eyebrow, title, icon: Icon, builds, ai: aiHelp, outcome }) => (
            <div
              key={day}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{eyebrow}</span>
              </div>
              <h3 className="mt-4 text-base font-black leading-snug">{title}</h3>
              <dl className="mt-3 space-y-2 text-xs leading-6">
                <div>
                  <dt className="font-black uppercase tracking-wide text-muted-foreground">You build</dt>
                  <dd className="text-foreground">{builds}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-wide text-muted-foreground">AI helps</dt>
                  <dd className="text-foreground">{aiHelp}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase tracking-wide text-muted-foreground">Outcome</dt>
                  <dd className="text-foreground">{outcome}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* AI positioning */}
      <section className="mt-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black">You won't build alone</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: Zap, label: "AI implementation guidance", body: "Step-by-step prompts that turn each task into action." },
            { Icon: MessageCircle, label: "AI co-pilot", body: "Always-on chat to unblock you while you build." },
            { Icon: Compass, label: "AI mentor", body: "Strategic feedback on your audience, hook, and offer." },
          ].map(({ Icon, label, body }) => (
            <div key={label} className="rounded-xl border border-border bg-background p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-black">{label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Optional readiness check */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-black">What are you trying to build? <span className="text-xs font-bold text-muted-foreground">(optional)</span></h2>
        <p className="mt-1 text-xs text-muted-foreground">We'll use this to personalise your challenge — you can skip it.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {READINESS_OPTIONS.map((opt) => {
            const active = intent === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setIntent(active ? "" : opt)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </section>

      {/* CTAs */}
      <section className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={startChallenge} className="h-14 gap-2 px-8 text-base font-black uppercase shadow-lg shadow-primary/20">
          <Rocket className="h-5 w-5" /> Start The 3-Day Challenge <ArrowRight className="h-4 w-4" />
        </Button>
        <Button asChild variant="outline" className="h-14 px-8 text-sm font-black uppercase">
          <Link to="/blueprint/dashboard">Continue Learning</Link>
        </Button>
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        This is your transition from understanding the system to building it. The challenge waits when you're ready.
      </p>
    </main>
  );
};

export default BlueprintBridge;
