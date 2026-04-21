import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Rocket, Users, Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";
import TaskCompleteAnim from "@/components/TaskCompleteAnim";
import Day2InviteNudge from "@/components/Day2InviteNudge";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import PostActionPromo from "@/components/PostActionPromo";
import Day1Setup, { getSetup } from "@/components/Day1Setup";
import { trackEvent } from "@/lib/analytics";
import { shareOrCopy } from "@/lib/share";

const dayConfig: Record<number, { title: string; nudge?: string; tasks: { key: string; label: string; hasTextarea: boolean; placeholder?: string }[] }> = {
  1: {
    title: "Foundation",
    tasks: [
      { key: "define_app", label: "Define your app", hasTextarea: true, placeholder: "Describe your app idea in 2-3 sentences…" },
      { key: "map_pages", label: "Map your pages", hasTextarea: true, placeholder: "List the pages your app needs…" },
      { key: "create_structure", label: "Create structure", hasTextarea: true, placeholder: "Outline the structure and navigation…" },
    ],
  },
  2: {
    title: "Build",
    nudge: "This is the hardest day — push through.",
    tasks: [
      { key: "build_core", label: "Build core feature", hasTextarea: false },
      { key: "connect_flow", label: "Connect flow", hasTextarea: false },
      { key: "test_mobile", label: "Test mobile", hasTextarea: false },
    ],
  },
  3: {
    title: "Launch",
    tasks: [
      { key: "finalize", label: "Finalize", hasTextarea: false },
      { key: "add_sharing", label: "Add sharing", hasTextarea: false },
      { key: "launch", label: "Launch", hasTextarea: false },
    ],
  },
};

const DayChallenge = () => {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const dayNum = Number(day) || 1;
  const config = dayConfig[dayNum] || dayConfig[1];
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTaskAnim, setShowTaskAnim] = useState(false);
  const [showPostActionPromo, setShowPostActionPromo] = useState(false);
  const [setupDone, setSetupDone] = useState(() => !!getSetup());

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
    }));
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
    shareOrCopy({ text: "I'm building a 3-day audience growth system — check it out!", url: referralLink });
    trackEvent("share_clicked", { day: dayNum });
    toast.success("Thanks for spreading the word!");
  };

  const handleInvite = () => {
    const inviteCode = state.user?.inviteCode ?? "";
    const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;
    shareOrCopy({ text: "I'm building a 3-day audience growth system — want to try it with me?", url: referralLink });
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
      toast.success(`Day ${dayNum} complete! Day ${dayNum + 1} is now unlocked.`);
      navigate("/dashboard");
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
      <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
        <Confetti />
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            You built and launched an app in 3 days.
          </h1>
          <p className="text-muted-foreground text-sm">
            That puts you ahead of 99% of people who just talk about building.
          </p>
        </div>

        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              This is where most people stop.
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              But this only grows if people see it.
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

        <Button variant="ghost" className="mt-2" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      <TaskCompleteAnim show={showTaskAnim} />
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Day {dayNum} of 3
        </p>
        <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
        {config.nudge && (
          <p className="mt-2 text-sm text-primary font-medium italic">{config.nudge}</p>
        )}
      </div>

      {dayNum === 2 && <Day2InviteNudge onContinue={() => {}} />}

      <div className="space-y-4">
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
                <Textarea
                  placeholder={task.placeholder}
                  value={getOutput(task.key)}
                  onChange={(e) => setOutput(task.key, e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dayNum === 3 && (
        <Card className="mt-4">
          <CardContent className="p-5">
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
        <Button className="mt-6 w-full gap-2" size="lg" onClick={completeDay}>
          <CheckCircle className="w-4 h-4" />
          {dayNum < 3 ? `Complete Day ${dayNum} → Unlock Day ${dayNum + 1}` : "Finish Challenge 🎉"}
        </Button>
      )}

      <div className="mt-6">
        <CrossPromoSpotlight
          title="Other builders in progress"
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
