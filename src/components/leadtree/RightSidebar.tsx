import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Gift, ChevronRight, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useFocusMode } from "@/context/FocusModeContext";
import { Progress } from "@/components/ui/progress";
import { getNextReward, pointRewards } from "@/lib/points";

const cardCls =
  "rounded-[16px] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]";
const headingCls =
  "mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]";

const RightSidebar = () => {
  const { state } = useAppState();
  const { rightCollapsed, toggleRight } = useFocusMode();
  const [top, setTop] = useState<{ name: string; pts: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("waitlist_signups")
        .select("name, confirmed_invites")
        .gt("confirmed_invites", 0)
        .order("confirmed_invites", { ascending: false })
        .limit(5);
      if (cancelled) return;
      setTop(
        (data ?? []).map((r: { name: string | null; confirmed_invites: number | null }) => ({
          name: (r.name || "Builder").split(" ")[0],
          pts: r.confirmed_invites ?? 0,
        })),
      );
    })();
    return () => { cancelled = true; };
  }, []);

  const points = state.points?.total ?? 0;
  const direct = state.network?.direct ?? 0;
  const nextReward = getNextReward(points);
  const threshold = nextReward?.points ?? points;
  const prevThreshold = (() => {
    const earned = pointRewards.map((r) => r.points).filter((c) => c <= points);
    return earned.length ? earned[earned.length - 1] : 0;
  })();
  const pct = nextReward
    ? Math.min(100, Math.max(0, ((points - prevThreshold) / Math.max(1, threshold - prevThreshold)) * 100))
    : 100;

  if (rightCollapsed) {
    return (
      <aside
        className="fixed right-0 top-[72px] bottom-0 z-30 hidden w-[48px] flex-col items-center border-l border-[#E5E7EB] bg-white py-4 lg:flex"
        aria-label="Insights (collapsed)"
      >
        <button
          type="button"
          onClick={toggleRight}
          aria-label="Expand insights"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6756F3] text-white shadow-sm hover:bg-[#5646d9]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="fixed right-0 top-[72px] bottom-0 z-30 hidden w-[320px] flex-col gap-6 overflow-y-auto bg-[#F7F8FA] px-6 py-6 lg:flex"
      aria-label="Insights"
    >
      <button
        type="button"
        onClick={toggleRight}
        aria-label="Collapse insights"
        className="absolute -left-4 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#6756F3] text-white shadow-sm hover:bg-[#5646d9]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {/* Top Referrers */}
      <div className={cardCls}>
        <p className={headingCls}>
          <Trophy className="h-3.5 w-3.5" /> Top Referrers
        </p>
        {top.length === 0 ? (
          <p className="text-sm text-[#6B7280]">Be the first to invite someone.</p>
        ) : (
          <ol className="space-y-3">
            {top.map((c, i) => (
              <li key={c.name + i} className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-[#6B7280] tabular-nums">{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium text-[#1F2937]">{c.name}</span>
                <span className="text-xs text-[#6B7280] tabular-nums">{c.pts}</span>
              </li>
            ))}
          </ol>
        )}
        <Link to="/leaderboard" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          View leaderboard <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Momentum */}
      <div className={cardCls}>
        <p className={headingCls}>
          <TrendingUp className="h-3.5 w-3.5" /> Momentum
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-[#1F2937]">{points}</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">Points</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-[#1F2937]">{direct}</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">Invites</p>
          </div>
        </div>
        <Progress value={pct} className="mt-4 h-1.5" />
        <p className="mt-2 text-xs text-[#6B7280]">
          {nextReward ? `${Math.max(0, threshold - points)} pts to next unlock` : "All rewards unlocked."}
        </p>
      </div>

      {/* Referral Rewards */}
      <div className={cardCls}>
        <p className={headingCls}>
          <Gift className="h-3.5 w-3.5" /> Referral Rewards
        </p>
        <p className="text-sm text-[#1F2937]">
          {nextReward ? nextReward.title : "You've unlocked every reward."}
        </p>
        {nextReward && (
          <p className="mt-1 text-xs text-[#6B7280]">at {nextReward.points} pts</p>
        )}
        <Link to="/earn" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Earn more <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
};

export default RightSidebar;
