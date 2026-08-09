import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCycle } from "@/lib/accessCycle";

export const REQUIRED_MONTHLY_INVITES = 5;
const DEFAULT_FEATURED_THRESHOLD = 100;


export interface ReferralBadge {
  id: string;
  name: string;
  threshold: number;
  description: string;
  earned: boolean;
}

export interface ReferralStats {
  currentMonthCount: number;
  invitesNeeded: number;
  pointsTotal: number;
  pointsNeeded: number;
  allTimeCount: number;
  featuredCreatorThreshold: number;
  featuredCreatorProgress: number;
  featuredCreatorRemaining: number;
  isFeaturedCreator: boolean;
  badges: ReferralBadge[];
  loading: boolean;
  refresh: () => void;
}

export const useReferralStats = (): ReferralStats => {
  const { user } = useAuth();

  const [currentMonthCount, setCurrentMonthCount] = useState(0);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [allTimeCount, setAllTimeCount] = useState(0);
  const [featuredCreatorThreshold, setFeaturedCreatorThreshold] = useState(
    DEFAULT_FEATURED_THRESHOLD
  );
  const [rawBadges, setRawBadges] = useState<
    { id: string; name: string; threshold: number; description: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const now = new Date();

    const [trackingRes, pointsRes, profileRes, settingsRes, badgesRes] = await Promise.all([
      user?.id
        ? supabase
            .from("monthly_invite_tracking")
            .select("invite_count")
            .eq("user_id", user.id)
            .eq("month", monthKey(now))
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user?.id
        ? supabase
            .from("monthly_points_tracking")
            .select("points_total")
            .eq("user_id", user.id)
            .eq("month", monthKey(now))
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user?.id
        ? supabase
            .from("profiles")
            .select("direct_referral_count")
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("featured_creator_settings")
        .select("threshold")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("invite_badges")
        .select("id, name, threshold, description, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    setCurrentMonthCount(trackingRes.data?.invite_count ?? 0);
    setPointsTotal(pointsRes.data?.points_total ?? 0);
    setAllTimeCount(profileRes.data?.direct_referral_count ?? 0);
    setFeaturedCreatorThreshold(
      settingsRes.data?.threshold ?? DEFAULT_FEATURED_THRESHOLD
    );
    setRawBadges(
      (badgesRes.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        threshold: b.threshold,
        description: b.description,
      }))
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const badges: ReferralBadge[] = rawBadges.map((b) => ({
    ...b,
    earned: allTimeCount >= b.threshold,
  }));

  return {
    currentMonthCount,
    invitesNeeded: Math.max(0, REQUIRED_MONTHLY_INVITES - currentMonthCount),
    pointsTotal,
    pointsNeeded: Math.max(0, 500 - pointsTotal),
    allTimeCount,
    featuredCreatorThreshold,
    featuredCreatorProgress: Math.min(allTimeCount, featuredCreatorThreshold),
    featuredCreatorRemaining: Math.max(0, featuredCreatorThreshold - allTimeCount),
    isFeaturedCreator: allTimeCount >= featuredCreatorThreshold,
    badges,
    loading,
    refresh: () => void load(),
  };
};

export default useReferralStats;
