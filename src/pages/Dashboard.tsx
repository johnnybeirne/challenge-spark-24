import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Users, TrendingUp } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import InviteNudgeCard from "@/components/InviteNudgeCard";
import InviteMilestoneModal from "@/components/InviteMilestoneModal";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";
import { usePromoter } from "@/hooks/usePromoter";
import { useNavigate } from "react-router-dom";

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

const identityLabels: Record<string, string> = {
  hidden_authority: "Hidden Authority",
  unactivated_audience: "Unactivated Audience",
  momentum_builder: "Momentum Builder",
  network_catalyst: "Network Catalyst",
};

const Dashboard = () => {
  const { state, setState, authUser, signOut } = useAppState();
  const { promoter } = usePromoter();
  const navigate = useNavigate();
  const currentDay = state.challenge.currentDay || 1;
  const tasks = dayTasks[currentDay] || dayTasks[1];
  const identityType = state.assessment?.identityType;

  const toggleTask = (taskKey: string) => {
    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        tasks: {
          ...prev.challenge.tasks,
          [taskKey]: !prev.challenge.tasks[taskKey],
        },
      },
    }));
  };

  const shareLink = () => {
    const code = state.user?.inviteCode || "XXXXX";
    const text = encodeURIComponent(
      `Join me on the 3-day trust leverage challenge! Use my code: ${code}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {state.user?.name ? `Hey, ${state.user.name}` : "Welcome back"}
          </p>
          <h1 className="text-xl font-bold text-foreground">
            Day {currentDay} of 3
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {identityType && (
            <Badge variant="secondary" className="text-xs">
              {identityLabels[identityType] || identityType}
            </Badge>
          )}
          {authUser && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}>
              Sign out
            </Button>
          )}
        </div>
      </div>

      {/* Invite nudge */}
      <div className="mb-4">
        <InviteNudgeCard />
      </div>

      {/* Milestone modal */}
      <InviteMilestoneModal />

      {/* Today's Challenge */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Today's Challenge
          </h2>
          <div className="space-y-3">
            {tasks.map((task, i) => {
              const key = `day${currentDay}_task${i}`;
              const checked = !!state.challenge.tasks[key];
              return (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleTask(key)}
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span
                    className={`text-sm transition-colors ${
                      checked
                        ? "line-through text-muted-foreground"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {task.label}
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card className="mb-4">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">
              Your referrals: <strong>{state.referrals.count}</strong>
            </span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={shareLink}>
            <Share2 className="w-3.5 h-3.5" />
            Share your link
          </Button>
        </CardContent>
      </Card>

      {/* Network Growth */}
      {(state.network.direct > 0 || state.network.indirect > 0) && (
        <Card className="mb-4 bg-primary/5">
          <CardContent className="p-5 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Your network is growing</p>
              <p className="text-xs text-muted-foreground">
                {state.network.direct} direct · {state.network.indirect} indirect builders
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Builder spotlight */}
      <div className="mb-4">
        <CrossPromoSpotlight
          title="Builder spotlight"
          subtitle="See what other builders are launching inside the network"
          position="dashboard"
        />
      </div>

      {/* Activity */}
      <div className="mb-4">
        <ActivityFeed limit={3} title="Builder activity" />
      </div>

    </div>
  );
};

export default Dashboard;
