import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useUserRole } from "@/hooks/useUserRole";


export const REQUIRED_MONTHLY_INVITES = 5;
export const REQUIRED_MONTHLY_POINTS = 500;

const monthKey = (d: Date) => d.toISOString().slice(0, 7);

const previousMonthKey = (d: Date) =>
  monthKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));

export interface AccessStatus {
  hasAccess: boolean;
  pointsTotal: number;
  pointsNeeded: number;
  inviteCount: number;
  gracePeriod: boolean;
  gracePeriodEndsAt: Date;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useAccessStatus = (): AccessStatus => {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { isAdmin, loading: roleLoading } = useUserRole();
  // "Owner" maps to the admin role in this system; admins are exempt from the access gate.
  const isExempt = isAdmin;


  const [pointsTotal, setPointsTotal] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setPointsTotal(0);
      setInviteCount(0);
      setPrevStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const now = new Date();
    const months = [monthKey(now), previousMonthKey(now)];

    const [pointsRes, invitesRes] = await Promise.all([
      supabase
        .from("monthly_points_tracking")
        .select("month, points_total, access_status")
        .eq("user_id", user.id)
        .in("month", months),
      supabase
        .from("monthly_invite_tracking")
        .select("month, invite_count")
        .eq("user_id", user.id)
        .in("month", months),
    ]);

    const pointRows = pointsRes.data ?? [];
    const currentPoints = pointRows.find((r) => r.month === monthKey(now));
    const previousPoints = pointRows.find((r) => r.month === previousMonthKey(now));
    setPointsTotal(currentPoints?.points_total ?? 0);
    setPrevStatus(previousPoints?.access_status ?? null);

    const inviteRows = invitesRes.data ?? [];
    const currentInvites = inviteRows.find((r) => r.month === monthKey(now));
    setInviteCount(currentInvites?.invite_count ?? 0);

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  );
  const gracePeriodEndsAt = new Date(monthStart.getTime() + 24 * 60 * 60 * 1000);

  const hasAccess = isExempt || isPremium || pointsTotal >= REQUIRED_MONTHLY_POINTS;
  const pointsNeeded = Math.max(0, REQUIRED_MONTHLY_POINTS - pointsTotal);

  const gracePeriod =
    !isExempt &&
    !isPremium &&
    prevStatus === "locked_out" &&
    pointsTotal < REQUIRED_MONTHLY_POINTS &&
    now.getUTCDate() === 1 &&
    now.getTime() < gracePeriodEndsAt.getTime();

  return {
    hasAccess,
    pointsTotal,
    pointsNeeded,
    inviteCount,
    gracePeriod,
    gracePeriodEndsAt,
    loading: loading || roleLoading,
    refresh: load,
  };

};

export default useAccessStatus;
