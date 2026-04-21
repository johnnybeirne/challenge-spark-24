import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Users, ArrowRight, Sparkles, Rocket } from "lucide-react";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import { getSetup } from "@/components/Day1Setup";
import aiAvatar from "@/assets/ai-avatar.jpg";

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
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {state.user?.name ? `Hey, ${state.user.name}` : "Welcome back"}
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Day {currentDay} of 3
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            You're building your growth system
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

      {/* Your Network */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Your network
              </p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {referralCount} {referralCount === 1 ? "builder" : "builders"} joined through you
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This grows as people join and invite others
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/referrals")} className="w-full font-semibold">
            Invite builders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Momentum nudge — < 3 referrals */}
      {referralCount < 3 && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground leading-snug">
                  You're {3 - referralCount} {3 - referralCount === 1 ? "invite" : "invites"} away from unlocking faster growth
                </p>
              </div>
            </div>
            <Progress value={(referralCount / 3) * 100} className="h-2 mb-3" />
            <Button onClick={() => navigate("/referrals")} className="w-full font-semibold">
              Invite now
              <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* AI co-pilot */}
      <Card className="mb-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/day/${currentDay}`)}>
        <CardContent className="p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Your AI co-pilot</p>
            <p className="text-xs text-muted-foreground">Get help building faster</p>
          </div>
          <Sparkles className="w-4 h-4 text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
