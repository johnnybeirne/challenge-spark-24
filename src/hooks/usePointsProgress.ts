import { useMemo } from "react";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useAccessSettings } from "@/hooks/useAccessSettings";
import { useReferredPeople } from "@/hooks/useReferredPeople";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { pointRules } from "@/lib/points";

export interface PointsMilestone {
  id: string;
  /** Two-line label shown under the tick, e.g. ["Day 1", "complete"]. */
  label: [string, string];
  /** Points this one action awards, shown as "+N" above the tick. */
  delta: number;
  /** Running cumulative total this milestone represents. */
  total: number;
  /** Position along the bar as a percent of the threshold, clamped to 100. */
  percent: number;
}

export interface PointsProgress {
  pointsTotal: number;
  pointsThreshold: number;
  inviteCount: number;
  /** pointsTotal as a percent of pointsThreshold, clamped 0 to 100. */
  progressPct: number;
  /** Name of the highest rewards-ladder rung reached, or "" if none yet. */
  tierName: string;
  milestones: PointsMilestone[];
  loading: boolean;
}

/**
 * Single source of truth for the participant's free-access points progress.
 * Drives both the invites page header card and the Momentum card in the
 * right rail, so the two always show the identical percentage.
 *
 * Sources (all live, none hardcoded):
 * - pointsTotal: current cycle total from useAccessStatus (monthly_points_tracking).
 * - pointsThreshold: useAccessSettings, backed by access_settings.points_threshold.
 * - inviteCount: useReferredPeople, the same source the invite list uses.
 * - tierName: highest rung reached on the live rewards ladder
 *   (SiteConfigContext config.rewards.ladder.rungs, edited in
 *   /owner-console/rewards-ladder).
 * - milestone deltas: pointRules ("complete_day_1"), the same per-action rate
 *   Rewards.tsx already reuses. Every current action in this app (signup,
 *   each day, each invite) awards this same amount, so one rate drives all
 *   four milestone deltas.
 */
export function usePointsProgress(): PointsProgress {
  const { pointsTotal, loading: accessLoading } = useAccessStatus();
  const { pointsThreshold, loading: settingsLoading } = useAccessSettings();
  const { count: inviteCount, loading: peopleLoading } = useReferredPeople();
  const { config } = useSiteConfig();

  const threshold = pointsThreshold > 0 ? pointsThreshold : 500;

  const progressPct = Math.max(
    0,
    Math.min(100, threshold > 0 ? Math.round((pointsTotal / threshold) * 100) : 0),
  );

  const pointsPerAction =
    pointRules.find((rule) => rule.id === "complete_day_1")?.points ?? 50;

  const milestones = useMemo<PointsMilestone[]>(() => {
    const steps: Array<[string, string, string]> = [
      ["signup", "Signed", "up"],
      ["day1", "Day 1", "complete"],
      ["day2", "Day 2", "complete"],
      ["day3", "Day 3", "complete"],
    ];
    let running = 0;
    return steps.map(([id, l1, l2]) => {
      running += pointsPerAction;
      const percent = threshold > 0 ? Math.min(100, Math.round((running / threshold) * 100)) : 0;
      return {
        id,
        label: [l1, l2] as [string, string],
        delta: pointsPerAction,
        total: running,
        percent,
      };
    });
  }, [pointsPerAction, threshold]);

  const tierName = useMemo(() => {
    const rungs = config.rewards.ladder.rungs ?? [];
    const reached = rungs
      .filter((r) => pointsTotal >= r.points)
      .sort((a, b) => b.points - a.points)[0];
    return reached?.name ?? "";
  }, [config.rewards.ladder.rungs, pointsTotal]);

  return {
    pointsTotal: Math.max(0, Math.round(pointsTotal)),
    pointsThreshold: Math.round(threshold),
    inviteCount: Math.max(0, Math.round(inviteCount)),
    progressPct,
    tierName,
    milestones,
    loading: accessLoading || settingsLoading || peopleLoading,
  };
}

export default usePointsProgress;
