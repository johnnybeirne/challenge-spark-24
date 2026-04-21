import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles } from "lucide-react";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import { getSetup } from "@/components/Day1Setup";
import aiAvatar from "@/assets/ai-avatar.png";

const dayTasks: Record<number, { label: string }[]> = {
  1: [
    { label: "Define your app" },
    { label: "Map your pages" },
    { label: "Create structure" },
  ],
  2: [
    { label: "Build core feature" },
    { label: "Connect flow" },
    { label: "Test mobile" },
  ],
  3: [
    { label: "Finalize" },
    { label: "Add sharing" },
    { label: "Launch" },
  ],
};

const challengeLabel: Record<string, string> = {
  "quick-win": "quick-win",
  "transformation": "transformation",
  "skill": "skill-building",
  "launch": "launch",
};

const audienceLabel = (v?: "b2b" | "b2c") =>
  v === "b2b" ? "businesses" : v === "b2c" ? "consumers" : "";

const Dashboard = () => {
  const { state, setState, authUser, signOut } = useAppState();
  const navigate = useNavigate();
  const currentDay = state.challenge.currentDay || 1;
  const tasks = dayTasks[currentDay] || dayTasks[1];
  const setup = getSetup();
  const referralCount = state.network.direct;

  // Delay invite card: only after first task done OR 30s on dashboard
  const [dwellElapsed, setDwellElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDwellElapsed(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  const toggleTask = (taskKey: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        tasks: { ...prev.challenge.tasks, [taskKey]: !prev.challenge.tasks[taskKey] },
      },
    }));
  };

  const completedCount = tasks.filter((_, i) => state.challenge.tasks[`day${currentDay}_task${i}`]).length;

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-6xl mx-auto sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono tracking-wider text-muted-foreground">
            {state.user?.name ? `Hey, ${state.user.name.split(" ")[0].toLowerCase()}` : "Welcome back"}
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Day {currentDay} of 3
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            You're building your AI-powered challenge app
          </p>
        </div>
        {authUser && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
          >
            Sign out
          </Button>
        )}
      </div>

      {/* Your Challenge / Setup */}
      <Card className="mb-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Your challenge
          </p>
          {setup ? (
            <>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                You're building a{" "}
                <span className="text-primary">{challengeLabel[setup.challengeType] ?? setup.challengeType}</span>{" "}
                for <span className="text-primary">{audienceLabel(setup.audienceType)}</span>
              </h2>
              {setup.topicHint && (
                <p className="text-sm text-muted-foreground mt-2">{setup.topicHint}</p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-foreground">Let's set this up</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Two quick taps and you're building.
              </p>
              <Button onClick={() => navigate("/day/1")} className="w-full font-semibold">
                Start setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {setup && (
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Today's tasks
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                {completedCount} / {tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {tasks.map((task, i) => {
                const key = `day${currentDay}_task${i}`;
                const checked = !!state.challenge.tasks[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleTask(key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
                      checked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <Checkbox checked={checked} className="pointer-events-none h-5 w-5" />
                    <span
                      className={`flex-1 font-medium transition-colors ${
                        checked ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate(`/day/${currentDay}`)}
            >
              Open Day {currentDay}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite card — low priority, delayed, single instance */}
      {(completedCount >= 1 || dwellElapsed) && (
        <Card className="mb-4 border-border">
          <CardContent className="p-4">
            <p className="font-semibold text-foreground">Build faster with others</p>
            <p className="text-sm text-muted-foreground mt-1">
              People who invite others are more likely to finish and launch.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Inviting builders unlocks tools that help you build faster.
            </p>
            <p className="text-xs text-muted-foreground mt-2">You can do this anytime.</p>

            <div className="mt-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">
                  Invite 3 builders to unlock extra tools
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.min(referralCount, 3)} / 3 builders invited
                </span>
              </div>
              <Progress value={(Math.min(referralCount, 3) / 3) * 100} className="h-1.5" />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/referrals")}
              className="w-full"
            >
              Invite someone
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Builder spotlight */}
      <div className="mb-4">
        <CrossPromoSpotlight
          title="Builder spotlight"
          subtitle="See what others are building"
          position="dashboard"
        />
      </div>

      {/* Johnny B AI */}
      <Card className="mb-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/day/${currentDay}`)}>
        <CardContent className="p-5 flex items-center gap-3">
          <img src={aiAvatar} alt="Johnny B AI" className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">Johnny B AI</p>
            <p className="text-xs text-muted-foreground">Get help building faster</p>
          </div>
          <Sparkles className="w-4 h-4 text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
