import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useUserRole } from "@/hooks/useUserRole";


export const REQUIRED_MONTHLY_INVITES = 5;

const monthKey = (d: Date) => d.toISOString().slice(0, 7);

const previousMonthKey = (d: Date) =>
  monthKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));

export interface AccessStatus {
  hasAccess: boolean;
  inviteCount: number;
  invitesNeeded: number;
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


  const [inviteCount, setInviteCount] = useState(0);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setInviteCount(0);
      setPrevStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const now = new Date();
    const { data } = await supabase
      .from("monthly_invite_tracking")
      .select("month, invite_count, access_status")
      .eq("user_id", user.id)
      .in("month", [monthKey(now), previousMonthKey(now)]);

    const rows = data ?? [];
    const current = rows.find((r) => r.month === monthKey(now));
    const previous = rows.find((r) => r.month === previousMonthKey(now));
    setInviteCount(current?.invite_count ?? 0);
    setPrevStatus(previous?.access_status ?? null);
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

  const hasAccess = isExempt || isPremium || inviteCount >= REQUIRED_MONTHLY_INVITES;
  const invitesNeeded = Math.max(0, REQUIRED_MONTHLY_INVITES - inviteCount);

  const gracePeriod =
    !isExempt &&
    !isPremium &&
    prevStatus === "locked_out" &&
    now.getUTCDate() === 1 &&
    now.getTime() < gracePeriodEndsAt.getTime();

  return {
    hasAccess,
    inviteCount,
    invitesNeeded,
    gracePeriod,
    gracePeriodEndsAt,
    loading: loading || roleLoading,
    refresh: load,
  };

};

export default useAccessStatus;
