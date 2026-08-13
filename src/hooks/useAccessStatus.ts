import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useUserRole } from "@/hooks/useUserRole";
import { useAccessSettings } from "@/hooks/useAccessSettings";
import { getCycle, getPreviousCycle, CYCLE_DAYS } from "@/lib/accessCycle";

export const REQUIRED_MONTHLY_INVITES = 5;
export const REQUIRED_MONTHLY_POINTS = 500;
export { CYCLE_DAYS };

export interface AccessStatus {
  hasAccess: boolean;
  pointsTotal: number;
  pointsNeeded: number;
  inviteCount: number;
  gracePeriod: boolean;
  gracePeriodEndsAt: Date;
  /** end of the participant's current 28 day cycle */
  cycleEndsAt: Date;
  daysLeftInCycle: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useAccessStatus = (): AccessStatus => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { pointsThreshold, loading: settingsLoading } = useAccessSettings();
  // "Owner" maps to the admin role in this system; admins are exempt from the access gate.
  const isExempt = isAdmin;

  const [pointsTotal, setPointsTotal] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [signupAt, setSignupAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setPointsTotal(0);
      setInviteCount(0);
      setPrevStatus(null);
      setSignupAt(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const anchor = profile?.created_at ?? user.created_at ?? null;
    setSignupAt(anchor);

    const current = getCycle(anchor);
    const previous = getPreviousCycle(anchor);
    const keys = [current.key, previous?.key].filter(Boolean) as string[];

    const [pointsRes, invitesRes] = await Promise.all([
      supabase
        .from("monthly_points_tracking")
        .select("month, points_total, access_status")
        .eq("user_id", user.id)
        .in("month", keys),
      supabase
        .from("monthly_invite_tracking")
        .select("month, invite_count")
        .eq("user_id", user.id)
        .in("month", keys),
    ]);

    const pointRows = pointsRes.data ?? [];
    setPointsTotal(pointRows.find((r) => r.month === current.key)?.points_total ?? 0);
    setPrevStatus(
      previous ? pointRows.find((r) => r.month === previous.key)?.access_status ?? null : null
    );

    const inviteRows = invitesRes.data ?? [];
    setInviteCount(inviteRows.find((r) => r.month === current.key)?.invite_count ?? 0);

    setLoading(false);
  }, [user?.id, user?.created_at]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = new Date();
  const cycle = getCycle(signupAt, now.getTime());
  // Grace runs for the first 24 hours of the participant's own new cycle.
  const gracePeriodEndsAt = new Date(cycle.startsAt.getTime() + 24 * 60 * 60 * 1000);

  // A brand new participant is inside their FIRST 28 day cycle and has had no
  // chance to earn points yet. They always have access until that cycle ends.
  const isFirstCycle = cycle.index === 0;

  const hasAccess = isExempt || isPremium || isFirstCycle || pointsTotal >= pointsThreshold;
  const pointsNeeded = Math.max(0, pointsThreshold - pointsTotal);

  const gracePeriod =
    !isExempt &&
    !isPremium &&
    !isFirstCycle &&
    prevStatus === "locked_out" &&
    pointsTotal < pointsThreshold &&
    now.getTime() < gracePeriodEndsAt.getTime();

  return {
    hasAccess,
    pointsTotal,
    pointsNeeded,
    inviteCount,
    gracePeriod,
    gracePeriodEndsAt,
    cycleEndsAt: cycle.endsAt,
    daysLeftInCycle: cycle.daysLeft,
    loading: loading || roleLoading || settingsLoading,
    refresh: load,
  };
};


export default useAccessStatus;
