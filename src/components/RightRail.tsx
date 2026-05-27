import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Sparkles, Trophy, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { useIsChallengerShell } from "@/hooks/useIsChallengerShell";
import { cn } from "@/lib/utils";
import { usePulseOnLogin } from "@/hooks/usePulseOnLogin";
import { supabase } from "@/integrations/supabase/client";


// Global right rail — momentum, social proof, rewards.
// Read-only surface: derives from existing state, mutates nothing.
const RightRail = () => {
  const isChallengerShell = useIsChallengerShell();
  const { state } = useAppState();
  const [collapsed, setCollapsed] = useState(false);
  const pulse = usePulseOnLogin();
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

  // Live top challengers — pulled from waitlist referral leaders.
  // Falls back to a sample only when no one has confirmed referrals yet.
  const [topChallengers, setTopChallengers] = useState<{ name: string; pts: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("waitlist_signups")
        .select("name, confirmed_invites")
        .gt("confirmed_invites", 0)
        .order("confirmed_invites", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(3);
      if (cancelled) return;
      const rows = (data ?? []).map((r: { name: string | null; confirmed_invites: number | null }) => ({
        name: (r.name || "Builder").split(" ")[0],
        pts: r.confirmed_invites ?? 0,
      }));
      if (rows.length > 0) {
        setTopChallengers(rows);
      } else {
        setTopChallengers([
          { name: "Alex R.", pts: Math.max(points + 120, 320) },
          { name: "Priya S.", pts: Math.max(points + 60, 260) },
          { name: "Marcus T.", pts: Math.max(points + 20, 210) },
        ]);
      }
    })();
    return () => { cancelled = true; };
  }, [points]);

  const nextUnlockLabel = completed
    ? "Community Access"
    : currentDay === 1
    ? "AI Prompt Pack"
    : currentDay === 2
    ? "Lead Magnet Templates"
    : "Community Access";

  if (collapsed) {
    return (
      <aside className="relative hidden w-[56px] shrink-0 flex-col items-center gap-3 border-l border-border bg-muted/30 p-3 lg:flex">
        <Button
          size="sm"
          variant="default"
          className={cn("h-10 w-10 rounded-full p-0 shadow-lg", pulse && "animate-attention-pulse")}
          onClick={() => setCollapsed(false)}
          aria-label="Expand stats panel"
          title="Expand stats"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Trophy className="mt-2 h-5 w-5 text-amber-500" />
        <Flame className="h-5 w-5 text-orange-500" />
        <Users className="h-5 w-5 text-emerald-500" />
        <Sparkles className="h-5 w-5 text-rose-500" />
      </aside>
    );
  }

  return (
    <aside className="relative hidden w-[300px] shrink-0 flex-col gap-3 overflow-visible border-l border-border bg-muted/30 p-4 lg:flex">
      <Button
        size="sm"
        variant="default"
        className={cn(
          "absolute -left-4 top-6 z-50 h-10 w-10 rounded-full p-0 shadow-lg hover:shadow-xl",
          pulse && "animate-attention-pulse"
        )}
        onClick={() => setCollapsed(true)}
        aria-label="Collapse stats panel"
        title="Collapse stats"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      {/* 1. TOP CHALLENGERS — social proof */}
      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Top Challengers</Eyebrow>
          <Trophy className="h-4 w-4 text-amber-500" />
        </div>
        <ol className="mt-3 space-y-2">
          {topChallengers.map((c, i) => (
            <li key={c.name} className="flex items-center justify-between gap-2">
              <Link
                to={`/leaderboard?focus=${encodeURIComponent(c.name)}`}
                className="flex min-w-0 items-center gap-2 group"
                title={`View ${c.name} on the leaderboard`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                  {i + 1}
                </span>
                <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline">{c.name}</span>
              </Link>
            </li>
          ))}
        </ol>
        <Link
          to="/leaderboard"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          View leaderboard <ChevronRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* 2. YOUR MOMENTUM */}
      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Your Momentum</Eyebrow>
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

      {/* 3. INVITE PROGRESS */}
      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Earn Referral Rewards</Eyebrow>
          <Users className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="mt-2 text-base font-bold text-foreground">
          Inviting people is the fastest way to earn reward points.
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, (directReferrals / 3) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {directReferrals >= 3 ? "Community unlocked" : `${3 - directReferrals} to community access`}
        </p>
        <Link
          to="/referrals"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:underline"
        >
          Invite a builder <ChevronRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* 4. NEXT UNLOCK */}
      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Next Unlock</Eyebrow>
          <Sparkles className="h-4 w-4 text-rose-500" />
        </div>
        <p className="mt-2 text-base font-bold text-foreground">{nextUnlockLabel}</p>
        {recentUnlock && (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            Latest: {recentUnlock.name}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {unlocksCount} reward{unlocksCount === 1 ? "" : "s"} unlocked
        </p>
        <Link
          to="/unlocks"
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          View vault <ChevronRight className="h-4 w-4" />
        </Link>
      </Card>
    </aside>
  );
};

export default RightRail;
