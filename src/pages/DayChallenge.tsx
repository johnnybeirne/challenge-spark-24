import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, CheckCircle, Lock, PlayCircle, Rocket, Users, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";
import TaskCompleteAnim from "@/components/TaskCompleteAnim";
import Day2InviteNudge from "@/components/Day2InviteNudge";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import PostActionPromo from "@/components/PostActionPromo";
import Day1Setup, { getSetup } from "@/components/Day1Setup";
import { DEMO_SETUP_RESET_KEY } from "@/pages/AdminViewAsUser";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";
import { audienceLabel, challengeTypeLabel, deriveChallengeName, memoryShareText, mergeMemory } from "@/lib/personalisation";
import { canAccessDay } from "@/lib/challengeProgression";
import AddToCalendar from "@/components/AddToCalendar";

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
    title: "Day 1: Define Your Challenge",
    intro: "Today you’ll define the challenge you want to create.",
    lesson: "By the end of this step, you should know who your challenge is for, what problem it helps solve, what simple outcome people should get, and why people would want to share it.",
    reinforcement: "Keep it clear and practical. You are learning by doing.",
    aiPrompt: "Let’s define your challenge clearly.",
    completion: "Your challenge is defined. Keep the momentum going.",
    tasks: [
      { key: "define_app", label: "Who is your challenge for?", hasTextarea: true, inputType: "input", placeholder: "Coaches, consultants, or experts who want more qualified leads" },
      { key: "problem", label: "What problem are they struggling with?", hasTextarea: true, inputType: "input", placeholder: "Their growth depends on constant content or outreach" },
      { key: "result", label: "What result should they get from your challenge?", hasTextarea: true, inputType: "input", placeholder: "A simple system to generate leads more consistently" },
      { key: "share_reason", label: "Why would someone invite a friend to this challenge?", hasTextarea: true, inputType: "input", placeholder: "It helps them spot what’s missing and improve faster" },
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
  const config = dayConfig[dayNum] || dayConfig[1];
  const memory = state.memory;
  const challengeType = challengeTypeLabel(memory.challengeType);
  const audience = audienceLabel(memory.audienceType);
  const challengeName = memory.challengeName || "your challenge";
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTaskAnim, setShowTaskAnim] = useState(false);
  const [showPostActionPromo, setShowPostActionPromo] = useState(false);
  const [setupDone, setSetupDone] = useState(() => {
    try {
      if (sessionStorage.getItem(DEMO_SETUP_RESET_KEY) === "1") {
        sessionStorage.removeItem(DEMO_SETUP_RESET_KEY);
        return false;
      }
    } catch {}
    return !!getSetup();
  });
  const firstName = state.user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [dayNum]);


  if (!canAccessDay(dayNum, state.challenge.startedAt)) {
    navigate(`/day/${state.challenge.currentDay || 1}`, { replace: true });
    return null;
  }

  if (dayNum === 1 && !setupDone) {
    return <Day1Setup onComplete={() => setSetupDone(true)} />;
  }

  const taskKey = (key: string) => `day${dayNum}_${key}`;
  const isChecked = (key: string) => !!state.challenge.tasks[taskKey(key)];
  const getOutput = (key: string) => state.challenge.aiOutputs[taskKey(key)] || "";

  const allDone = config.tasks.every((t) => isChecked(t.key));
  const hasValidUrl = dayNum === 3 ? isValidUrl(state.challenge.launchUrl) : true;
  const canComplete = allDone && hasValidUrl;

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
      toast.success(`${config.completion.replace(".", `, ${firstName}.`)} Day ${dayNum + 1} is now unlocked.`);
      navigate("/user-dashboard");
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

        <Button variant="ghost" className="mt-2" onClick={() => navigate("/user-dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="app-page-container flex flex-col min-h-screen py-6 pb-24 lg:py-8">
      <TaskCompleteAnim show={showTaskAnim} />
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Day {dayNum} of 3
        </p>
        <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {config.intro}
        </p>
        {config.nudge && (
          <p className="mt-2 text-sm text-primary font-medium italic">{config.nudge}</p>
        )}
      </div>

      {dayNum === 1 && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Set your 3-day build time</p>
              <p className="mt-1 text-sm text-muted-foreground">Set aside 60 minutes each day to complete your challenge.</p>
            </div>
            <AddToCalendar className="w-full sm:w-auto" />
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <PlayCircle className="h-4 w-4" />
            <p className="text-xs font-mono uppercase tracking-wider">Training</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {dayNum === 1
              ? config.lesson
              : dayNum === 2
                ? config.lesson
                : config.lesson}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {dayNum === 1 && memory.desiredOutcome
              ? `Your goal is: ${memory.desiredOutcome}`
              : config.reinforcement}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-4 border-border">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Brain className="h-4 w-4" />
            <p className="text-xs font-mono uppercase tracking-wider">AI coaching</p>
          </div>
          <p className="text-sm font-medium text-foreground">
            {dayNum === 2
              ? config.aiPrompt
              : dayNum === 3
                ? config.aiPrompt
                : config.aiPrompt}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Open Johnny B AI if you want help before completing the tasks.</p>
        </CardContent>
      </Card>

      {dayNum === 1 && (
        <Card className="mb-4 border-border bg-muted/30">
          <CardContent className="p-5">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Why this works
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              This isn't a one-time challenge. Once you build it, it keeps running.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              And as people go through it, they invite others to unlock more — so it grows on its own.
            </p>
          </CardContent>
        </Card>
      )}

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
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Action tasks</p>
        {config.tasks.map((task, i) => (
          <Card key={task.key}>
            <CardContent className="p-5">
              <label
                className="flex items-center gap-3 cursor-pointer group mb-3"
                onClick={() => toggleTask(task.key)}
              >
                <Checkbox checked={isChecked(task.key)} className="pointer-events-none" />
                <span
                  className={`text-sm font-medium transition-colors ${
                    isChecked(task.key)
                      ? "line-through text-muted-foreground"
                      : "text-foreground group-hover:text-primary"
                  }`}
                >
                  {i + 1}. {task.label}
                </span>
              </label>
              {task.hasTextarea && (
                <div className="space-y-3">
                  {task.inputType === "input" ? (
                    <Input
                      placeholder={task.placeholder}
                      value={getOutput(task.key)}
                      onChange={(e) => setOutput(task.key, e.target.value)}
                    />
                  ) : (
                    <Textarea
                      placeholder={task.placeholder}
                      value={getOutput(task.key)}
                      onChange={(e) => setOutput(task.key, e.target.value)}
                      className="mt-1"
                      rows={6}
                    />
                  )}
                  {task.helper && <p className="text-xs leading-relaxed text-muted-foreground">{task.helper}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dayNum === 3 && (
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

      {canComplete && (
        <Card className="mt-6 border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-5">
            <p className="mb-4 text-sm font-semibold leading-relaxed text-foreground">
              {config.completion.replace(".", `, ${firstName}.`)}
            </p>
            <Button className="w-full gap-2" size="lg" onClick={completeDay}>
              <CheckCircle className="w-4 h-4" />
              {dayNum === 1 ? "Continue to Day 2" : dayNum === 2 ? "Continue to Day 3" : "Start Building Your Challenge"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4 border-dashed bg-muted/30">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Unlock this when you’re ready to go deeper, {firstName}.</span>
        </CardContent>
      </Card>

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
