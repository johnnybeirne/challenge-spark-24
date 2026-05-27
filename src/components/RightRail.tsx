import { Link } from "react-router-dom";
import { Flame, Sparkles, Trophy, Users, ChevronRight } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useIsChallengerShell } from "@/hooks/useIsChallengerShell";
import { cn } from "@/lib/utils";

// Global right rail — momentum, social proof, rewards.
// Read-only surface: derives from existing state, mutates nothing.
const RightRail = () => {
  const isChallengerShell = useIsChallengerShell();
  const { state } = useAppState();
  if (!isChallengerShell) return null;
  const points = state.credits?.total ?? 0;
  const currentDay = state.challenge?.currentDay ?? 1;
  const completed = !!state.challenge?.completed;
  const directReferrals = state.network?.direct ?? 0;
  const unlocksCount = state.unlocks?.length ?? 0;
  const recentUnlock = state.unlocks?.[state.unlocks.length - 1];

  const dayProgress = completed ? 100 : Math.min(100, Math.round(((currentDay - 1) / 3) * 100));

  const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("rounded-xl border border-border bg-background p-4 shadow-sm", className)}>
      {children}
    </div>
  );

  // Eyebrow labels — small uppercase, but never below 14px.
  // Hierarchy comes from weight, color, and letter-spacing — not tiny type.
  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );

  return (
    <aside className="hidden h-[calc(100vh-3rem)] w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-muted/30 p-4 xl:flex">
      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Momentum</Eyebrow>
          <Flame className="h-4 w-4 text-orange-500" />
        </div>
        <p className="mt-3 text-2xl font-black text-foreground">{points} pts</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${dayProgress}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          {completed ? "Challenge complete" : `Day ${currentDay} of 3`}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Rewards</Eyebrow>
          <Sparkles className="h-4 w-4 text-rose-500" />
        </div>
        <p className="mt-2 text-base font-bold text-foreground">
          {unlocksCount} unlocked
        </p>
        {recentUnlock && (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            Latest: {recentUnlock.name}
          </p>
        )}
        <Link
          to="/unlocks"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          View vault <ChevronRight className="h-4 w-4" />
        </Link>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Network</Eyebrow>
          <Users className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="mt-2 text-base font-bold text-foreground">
          {directReferrals} {directReferrals === 1 ? "builder" : "builders"} invited
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {directReferrals >= 3 ? "Community unlocked" : `${3 - directReferrals} to community access`}
        </p>
        <Link
          to="/referrals"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:underline"
        >
          Invite a builder <ChevronRight className="h-4 w-4" />
        </Link>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Leaderboard</Eyebrow>
          <Trophy className="h-4 w-4 text-amber-500" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          See how you rank against this week's builders.
        </p>
        <Link
          to="/leaderboard"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          View leaderboard <ChevronRight className="h-4 w-4" />
        </Link>
      </Card>
    </aside>
  );
};

export default RightRail;
