import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import DictatedInput from "@/components/dictation/DictatedInput";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Brain, CheckCircle, Gift, Lock, PlayCircle, Rocket, Sparkles, Users, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";
import TaskCompleteAnim from "@/components/TaskCompleteAnim";
import Day2InviteNudge from "@/components/Day2InviteNudge";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import PostActionPromo from "@/components/PostActionPromo";
// Day1Setup moved to /training hub
import { DEMO_SETUP_RESET_KEY } from "@/pages/AdminViewAsUser";
import { trackEvent } from "@/lib/analytics";
import { isChallengeExpired } from "@/lib/challengeWindow";
import ChallengeCountdown from "@/components/ChallengeCountdown";
import { shareOrCopy } from "@/lib/share";
import { audienceLabel, challengeTypeLabel, deriveChallengeName, memoryShareText, mergeMemory } from "@/lib/personalisation";
import { canAccessDay, getDayUnlock } from "@/lib/challengeProgression";
import AddToCalendar from "@/components/AddToCalendar";
import DayTrainingCard from "@/components/DayTrainingCard";
import DayCopilot from "@/components/DayCopilot";
import DayVideoModal from "@/components/DayVideoModal";
import UpgradeCards from "@/components/UpgradeCards";
import { supabase } from "@/integrations/supabase/client";
import { useDayContent } from "@/hooks/useDayContent";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";

const diagnosticQuestions = [
  "Do you have a reliable way to generate leads that doesn’t depend on constant effort?",
  "If you stopped promoting or publishing content, would your leads drop off?",
  "Can you clearly identify what is driving most of your leads?",
  "Are most of your leads already trusting you before you speak to them?",
  "Do you have a system that encourages people to invite others they know?",
  "Is your lead magnet the same for everyone who finds you?",
  "When someone becomes a lead, do they know exactly what to do next?",
  "Do you have something that continues to bring in leads after it’s been set up?",
  "Do your leads only come in when you are actively working on it?",
];

const dayConfig: Record<number, { title: string; intro: string; lesson: string; reinforcement: string; aiPrompt: string; completion: string; nudge?: string; tasks: { key: string; label: string; hasTextarea: boolean; inputType?: "input" | "textarea"; placeholder?: string; helper?: string }[] }> = {
  1: {
    title: "Define Your Challenge",
    intro: "Today you’ll decide who your challenge is for, what problem it solves, and the simple result people should get.",
    lesson: "Watch the short training, then complete the action tasks below.",
    reinforcement: "",
    aiPrompt: "Let’s define your challenge clearly.",
    completion: "Finish your answers to unlock Day 2.",
    tasks: [
      { key: "define_app", label: "Who is this challenge for?", hasTextarea: true, inputType: "input", placeholder: "Coaches, consultants, or experts who want more qualified leads", helper: "Example answer: Coaches, consultants, or experts who want more qualified leads." },
      { key: "problem", label: "What problem are they struggling with?", hasTextarea: true, inputType: "input", placeholder: "Their growth depends on constant content or outreach", helper: "Example answer: Their growth depends on constant content or outreach." },
      { key: "result", label: "What result should they get?", hasTextarea: true, inputType: "input", placeholder: "A simple system to generate leads more consistently", helper: "Example answer: A simple system to generate leads more consistently." },
      { key: "share_reason", label: "Why would someone invite a friend?", hasTextarea: true, inputType: "input", placeholder: "It helps them identify what’s missing and improve faster", helper: "Example answer: It helps them identify what’s missing and improve faster." },
    ],
  },
  2: {
    title: "Day 2: Build Your Lead Magnet Quiz",
    intro: "Today you’ll create the quiz that acts as the entry point to your challenge.",
    lesson: "A strong quiz helps people see where they are now, notice what is missing, understand why the challenge matters, and feel motivated to continue.",
    reinforcement: "This is not just a lead magnet. This is the diagnostic inside your challenge.",
    aiPrompt: "Help me create a diagnostic quiz for my challenge.",
    completion: "Your quiz is mapped. Now turn it into a simple working challenge.",
    nudge: "Keep it focused — each question should reveal a different gap.",
    tasks: [
      { key: "quiz_questions", label: "Your Questions", hasTextarea: true, inputType: "textarea", placeholder: "Write your own quiz questions here.", helper: "Use 5 to 9 yes/no questions. Each question should reveal a different gap. Avoid repeating the same idea in different ways." },
    ],
  },
  3: {
    title: "Day 3: Build Your AI-Powered Challenge",
    intro: "Today you’ll turn your idea and quiz into a simple challenge.",
    lesson: "Your first version does not need to be complex. It only needs a clear promise, a quiz entry point, a simple result or diagnosis, 3 short challenge steps, and a reason for people to invite others.",
    reinforcement: "Build the smallest useful version first.",
    aiPrompt: "Help me turn my idea and quiz into a simple 3-day AI-powered challenge.",
    completion: "You built a working challenge. That puts you ahead of most.",
    tasks: [
      { key: "landing_page", label: "Create your challenge landing page", hasTextarea: false },
      { key: "lead_magnet_quiz", label: "Add your lead magnet quiz", hasTextarea: false },
      { key: "result_page", label: "Add your result page", hasTextarea: false },
      { key: "day_content", label: "Create Day 1, Day 2, Day 3 content", hasTextarea: false },
      { key: "invite_step", label: "Add a simple invite step", hasTextarea: false },
    ],
  },
};

const DayChallenge = () => {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const dayNum = Number(day) || 1;
  const dayContent = useDayContent();
  const cmsCfg = dayContent[`day${dayNum}` as "day1" | "day2" | "day3"] || dayContent.day1;
  const baseConfig = dayConfig[dayNum] || dayConfig[1];
  const config = {
    ...baseConfig,
    title: cmsCfg.title || baseConfig.title,
    intro: cmsCfg.intro || baseConfig.intro,
    lesson: cmsCfg.lesson || baseConfig.lesson,
    reinforcement: cmsCfg.reinforcement || baseConfig.reinforcement,
    nudge: cmsCfg.nudge || baseConfig.nudge,
    completion: cmsCfg.completion || baseConfig.completion,
    tasks: (cmsCfg.tasks && cmsCfg.tasks.length > 0
      ? cmsCfg.tasks.map((t) => ({
          key: t.key,
          label: t.label,
          hasTextarea: t.hasTextarea,
          inputType: (t.inputType === "textarea" ? "textarea" : "input") as "input" | "textarea",
          placeholder: t.placeholder || undefined,
          helper: t.helper || undefined,
        }))
      : baseConfig.tasks),
  };
  const memory = state.memory;
  const challengeType = challengeTypeLabel(memory.challengeType);
  const audience = audienceLabel(memory.audienceType);
  const challengeName = memory.challengeName || "your challenge";
  const identity = useChallengeIdentity();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTaskAnim, setShowTaskAnim] = useState(false);
  const [showPostActionPromo, setShowPostActionPromo] = useState(false);
  // Setup state moved to /training hub
  const firstName = state.user?.name?.split(" ")[0] || "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [dayNum]);


  const { authUser } = useAppState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!authUser?.id) { setIsAdmin(false); setAdminChecked(true); return; }
    supabase.rpc("has_role", { _user_id: authUser.id, _role: "admin" }).then(({ data }) => {
      if (!cancelled) { setIsAdmin(Boolean(data)); setAdminChecked(true); }
    });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const dayLocked = adminChecked && !isAdmin && !canAccessDay(dayNum, state.challenge.startedAt);
  if (dayLocked && dayNum !== 2 && dayNum !== 3) {
    navigate(`/day/${state.challenge.currentDay || 1}`, { replace: true });
    return null;
  }

  // Completed days are view-only — answers remain visible but nothing is editable.
  const currentDayNum = state.challenge.currentDay ?? 1;
  const isReadOnly =
    adminChecked && !isAdmin && (currentDayNum > dayNum || (state.challenge.completed && dayNum < 3));

  // Locked screen for Day 2 / Day 3 before they unlock
  if (dayLocked && (dayNum === 2 || dayNum === 3)) {
    const unlock = getDayUnlock(dayNum, state.challenge.startedAt);
    return (
      <div className="app-page-container min-h-screen py-8 pb-24 lg:py-12">
        <section className="mx-auto max-w-3xl space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Day {dayNum} locked
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">
              Day {dayNum} opens {unlock.label.toLowerCase()}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Come back when Day {dayNum} unlocks — your progress is saved.
            </p>
          </div>
          <UpgradeCards />
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/challenger-dashboard")}>
              Back to dashboard
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Setup is now embedded in /training (the onboarding hub).
  // Day 1 focuses purely on training, tasks, and AI help.

  const taskKey = (key: string) => `day${dayNum}_${key}`;
  const isChecked = (key: string) => !!state.challenge.tasks[taskKey(key)];
  const getOutput = (key: string) => state.challenge.aiOutputs[taskKey(key)] || "";

  const allDone = config.tasks.every((t) => isChecked(t.key));
  const hasValidUrl = dayNum === 3 ? isValidUrl(state.challenge.launchUrl) : true;
  const windowExpired = isChallengeExpired(state.challenge.endsAt);
  const canComplete = allDone && hasValidUrl && !windowExpired;

  const communityEligible =
    state.challenge.launchUrl &&
    isValidUrl(state.challenge.launchUrl) &&
    state.network.direct >= 3;

  const toggleTask = (key: string) => {
    const wasChecked = isChecked(key);
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        tasks: { ...prev.challenge.tasks, [taskKey(key)]: !prev.challenge.tasks[taskKey(key)] },
      },
    }));
    if (!wasChecked) {
      setShowTaskAnim(true);
      setTimeout(() => setShowTaskAnim(false), 100);
      if (Math.random() < 0.3) {
        setTimeout(() => setShowPostActionPromo(true), 600);
      }
    }
  };

  const setOutput = (key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        aiOutputs: { ...prev.challenge.aiOutputs, [taskKey(key)]: value },
      },
      memory: dayNum === 1 && key === "define_app"
        ? mergeMemory(prev.memory, {
            topic: value,
            challengeName: prev.memory.challengeName || deriveChallengeName(value),
          })
        : prev.memory,
    }));
    if (dayNum === 1 && key === "define_app") trackEvent("memory_updated", { source: "day1_define_app" });
  };

  const notifyDashboardUpdated = (key: string) => {
    const value = getOutput(key);
    if (!value || !value.trim()) return;
    toast.success("Your dashboard is updated", {
      description: `Day ${dayNum} answer saved`,
      position: "top-right",
      duration: 3500,
      action: {
        label: "Dashboard",
        onClick: () => navigate("/challenger-dashboard"),
      },
    });
  };



  const setLaunchUrl = (url: string) => {
    setState((prev) => ({
      ...prev,
      challenge: { ...prev.challenge, launchUrl: url },
    }));
  };

  const handleShare = () => {
    const inviteCode = state.user?.inviteCode ?? "";
    const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;
    shareOrCopy({ text: memoryShareText(memory), url: referralLink });
    trackEvent("share_clicked", { day: dayNum });
    toast.success("Thanks for spreading the word!");
  };

  const handleInvite = () => {
    const inviteCode = state.user?.inviteCode ?? "";
    const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;
    shareOrCopy({ text: memoryShareText(memory), url: referralLink });
    trackEvent("share_clicked", { day: dayNum, type: "invite" });
    toast.success("Invite sent — one step closer to Builder Circle.");
  };

  const unlockCommunity = () => {
    setState((prev) => ({
      ...prev,
      community: { ...prev.community, unlocked: true, unlockedAt: new Date().toISOString(), entryReason: "invited_3" },
    }));
    trackEvent("community_unlocked");
    toast.success("Builder Circle unlocked! 🎉");
    navigate("/community");
  };

  const completeDay = () => {
    if (dayNum < 3) {
      setState((prev) => ({
        ...prev,
        challenge: { ...prev.challenge, currentDay: dayNum + 1 },
      }));
      trackEvent("day_completed", { day: dayNum });
      setShowCelebration(true);
    } else {
      setState((prev) => ({
        ...prev,
        challenge: { ...prev.challenge, completed: true },
      }));
      trackEvent("day_completed", { day: 3 });
      trackEvent("challenge_completed");
      setShowCelebration(true);
    }
  };

  // Day 1 & Day 2 completion interstitial — quiet celebration + tomorrow preview
  if (showCelebration && dayNum < 3) {
    const nextDayMeta: Record<number, { title: string; focus: string; unlock: string }> = {
      2: {
        title: "Day 2 — Build Your Lead Magnet Quiz",
        focus: "Turn your challenge into a quiz that captures qualified leads on autopilot.",
        unlock: "Lead Magnet Templates",
      },
      3: {
        title: "Day 3 — Build Your AI-Powered Challenge",
        focus: "Launch the AI-powered challenge that nurtures your audience automatically.",
        unlock: "Community Access",
      },
    };
    const next = nextDayMeta[dayNum + 1];
    const completedLine = config.completion.replace(".", firstName ? `, ${firstName}.` : ".");

    return (
      <div className="app-page-container min-h-screen py-8 pb-24 lg:py-12">
        <Confetti />
        <section className="mx-auto max-w-xl space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-scale-in">
              <CheckCircle className="h-9 w-9 text-primary" strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              Day {dayNum} complete
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">
              {completedLine}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {dayNum} of 3 days done · Momentum is building{identity.isPersonalised ? ` in ${identity.shortTitle}` : ""}.
            </p>
          </div>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                    Tomorrow's focus
                  </p>
                  <p className="mt-1 text-base font-bold text-foreground">{next.title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{next.focus}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Gift className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Next unlock
                </p>
                <p className="text-sm font-bold text-foreground">{next.unlock}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              size="lg"
              className="h-12 flex-1 gap-2 text-sm font-black uppercase tracking-wider"
              onClick={() => navigate(`/day/${dayNum + 1}`)}
            >
              Start Day {dayNum + 1}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 flex-1 text-sm font-bold"
              onClick={() => navigate("/challenger-dashboard")}
            >
              Back to dashboard
            </Button>
          </div>

          <UpgradeCards />
        </section>
      </div>
    );
  }



  // Day 3 celebration + community intro view
  if (showCelebration && dayNum === 3) {
    return (
      <div className="app-page-container flex flex-col min-h-screen py-6 pb-24 lg:py-8">
        <Confetti />
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            You launched something real, {firstName}.
          </h1>
          <p className="text-muted-foreground text-sm">
            That puts you ahead of most.
          </p>
        </div>

        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              Your challenge is now live.
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              It runs continuously and grows as people go through it and invite others.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Builder Circle</h2>
            </div>
            <p className="text-sm text-foreground font-medium mb-1">
              You've built something real. Now get it seen.
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              Join a network where builders promote each other.
            </p>

            <div className="space-y-3 mb-5">
              <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Share your launch
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleInvite}>
                <UserPlus className="w-4 h-4" /> Invite a builder
              </Button>
            </div>

            <div className="text-xs text-muted-foreground mb-4">
              {state.network.direct} / 3 direct referrals
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!communityEligible}
              onClick={unlockCommunity}
            >
              <Users className="w-4 h-4" />
              Unlock Builder Circle
            </Button>
            {!communityEligible && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Submit your live URL and invite 3 builders to unlock.
              </p>
            )}
          </CardContent>
        </Card>

        <UpgradeCards />

        <Button variant="ghost" className="mt-2" onClick={() => navigate("/challenger-dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="app-page-container flex flex-col min-h-screen py-6 pb-24 lg:py-8">
      <TaskCompleteAnim show={showTaskAnim} />
      {isReadOnly && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Day {dayNum} is complete.</span>{" "}
          Your answers are saved.
        </div>
      )}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Day {dayNum} of 3
        </p>
        <h1 className="text-2xl font-bold text-foreground">{config.title.replace(/^Day\s*\d+\s*[:\-–]\s*/i, "")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {config.intro}
        </p>
        {config.nudge && !isReadOnly && (
          <p className="mt-2 text-sm text-primary font-medium italic">{config.nudge}</p>
        )}
      </div>

      {dayNum === 1 && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Let's Shape Your Challenge</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Define the transformation your challenge takers will achieve.
            </p>
          </div>
          <ul className="mt-5 space-y-3">
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
        </div>
      )}



      {/* AI-guided training (primary). Video kept below as optional briefing. */}
      {dayNum === 2 && !isReadOnly && (
        <div className="mb-6 space-y-6">
          <DayVideoModal dayNum={2} />
          <DayCopilot
            dayNum={2}
            eyebrow="Day 2 · AI-guided training"
            focus="Build the diagnostic quiz that becomes the entry point into your challenge."
            focusSubtitle="A great diagnostic surfaces the gap, creates urgency, and earns the right to invite people in."
            outputKeyPrefix="day2_copilot"
            starters={[
              "Draft 5 diagnostic questions that surface the gap my audience feels.",
              "Rewrite my diagnostic so it feels insight-driven, not generic.",
              "Suggest a results screen that makes people want to join my challenge.",
              "How do I score the diagnostic so the result feels personal?",
            ]}
          />
        </div>
      )}

      {dayNum === 3 && !isReadOnly && (
        <div className="mb-6 space-y-6">
          <DayVideoModal dayNum={3} />
          <DayCopilot
            dayNum={3}
            eyebrow="Day 3 · AI-guided training"
            focus="Design the challenge experience, momentum systems, and referral flow."
            focusSubtitle="Lock in the daily cadence, the unlock moments, and the reasons people invite others in."
            outputKeyPrefix="day3_copilot"
            starters={[
              "Map a 3-day momentum arc that keeps people moving.",
              "Suggest 3 unlocks I can tie to participant referrals.",
              "Write a Day 3 invite message my audience will actually send.",
              "What's the smallest viable launch I can ship this week?",
            ]}
          />
        </div>
      )}

      {/* Optional supporting briefing — video stays available, not primary */}
      <details className="mb-4 rounded-lg border border-border bg-card/60">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
          Optional briefing video
        </summary>
        <div className="px-4 pb-4">
          <DayTrainingCard dayNum={dayNum} />
          {dayNum !== 1 && (
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground leading-relaxed">{config.lesson}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{config.reinforcement}</p>
            </div>
          )}
        </div>
      </details>



      {dayNum === 2 && (
        <Card className="mb-4 border-border">
          <CardContent className="p-5">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Example Diagnostic</p>
            <ol className="space-y-3 text-sm text-foreground">
              {diagnosticQuestions.map((question, index) => (
                <li key={question} className="flex gap-3 leading-relaxed">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {dayNum === 2 && <Day2InviteNudge onContinue={() => {}} />}

      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{dayNum === 1 ? "Your Build Tasks" : "Action tasks"}</p>
        {config.tasks.map((task, i) => (
          <Card key={task.key}>
            <CardContent className="p-5">
              <label
                className={`flex items-center gap-3 group mb-3 ${isReadOnly ? "" : "cursor-pointer"}`}
                onClick={isReadOnly ? undefined : () => toggleTask(task.key)}
              >
                <Checkbox checked={isChecked(task.key)} disabled={isReadOnly} className="pointer-events-none" />
                <span
                  className={`text-sm font-medium transition-colors ${
                    isChecked(task.key)
                      ? "line-through text-muted-foreground"
                      : isReadOnly
                        ? "text-foreground"
                        : "text-foreground group-hover:text-primary"
                  }`}
                >
                  {i + 1}. {task.label}
                </span>
              </label>
              {task.hasTextarea && (
                <div className="space-y-3">
                  {isReadOnly ? (
                    task.inputType === "input" ? (
                      <Input value={getOutput(task.key)} readOnly disabled />
                    ) : (
                      <Textarea value={getOutput(task.key)} readOnly disabled className="mt-1" rows={6} />
                    )
                  ) : task.inputType === "input" ? (
                    <DictatedInput
                      placeholder={task.placeholder}
                      value={getOutput(task.key)}
                      onChange={(e) => setOutput(task.key, e.target.value)}
                      onBlur={() => notifyDashboardUpdated(task.key)}
                    />
                  ) : (
                    <DictatedTextarea
                      placeholder={task.placeholder}
                      value={getOutput(task.key)}
                      onChange={(e) => setOutput(task.key, e.target.value)}
                      onBlur={() => notifyDashboardUpdated(task.key)}
                      className="mt-1"
                      rows={6}
                    />
                  )}
                  {task.helper && !isReadOnly && <p className="text-xs leading-relaxed text-muted-foreground">{task.helper}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dayNum === 3 && !isReadOnly && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Tool Note</p>
              <p className="text-sm text-foreground leading-relaxed">This challenge was built using Lovable.</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                To build your own version, you’ll use the same approach. A Pro account gives you more credits and flexibility.
              </p>
            </div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Paste your live URL
            </label>
            <Input
              type="url"
              placeholder="https://your-app.com"
              value={state.challenge.launchUrl || ""}
              onChange={(e) => setLaunchUrl(e.target.value)}
            />
            {state.challenge.launchUrl && !isValidUrl(state.challenge.launchUrl) && (
              <p className="text-xs text-destructive mt-1">Please enter a valid URL starting with https://</p>
            )}
          </CardContent>
        </Card>
      )}

      {dayNum === 3 && isReadOnly && state.challenge.launchUrl && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Your live URL</p>
            <a href={state.challenge.launchUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">
              {state.challenge.launchUrl}
            </a>
          </CardContent>
        </Card>
      )}

      {canComplete && !isReadOnly && (
        <Card className="mt-6 border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-5">
            <p className="mb-4 text-sm font-semibold leading-relaxed text-foreground">
              {config.completion.replace(".", `, ${firstName}.`)}
            </p>
            <Button className="w-full gap-2" size="lg" onClick={completeDay}>
              <CheckCircle className="w-4 h-4" />
              {dayNum === 1 ? "Complete Day 1" : dayNum === 2 ? "Continue to Day 3" : "Start Building Your Challenge"}
            </Button>
          </CardContent>
        </Card>
      )}


      <div className="mt-6">
        <CrossPromoSpotlight
          title="Other apps in progress"
          subtitle=""
          position={`day-${dayNum}`}
        />
      </div>

      <PostActionPromo
        open={showPostActionPromo}
        onClose={() => setShowPostActionPromo(false)}
        position={`day-${dayNum}-task-complete`}
      />
    </div>
  );
};

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default DayChallenge;
