import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BadgeRecord {
  id: string;
  badge_id: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string;
  earned_at: string;
}

const BADGE_DEFS = [
  { id: "early_adopter", name: "Early Adopter", desc: "Joined in the first wave", icon: "star", check: () => true },
  { id: "top_inviter_3", name: "Networker", desc: "Invited 3+ builders", icon: "users", checkReferrals: 3 },
  { id: "top_inviter_10", name: "Top Inviter", desc: "Invited 10+ builders", icon: "trophy", checkReferrals: 10 },
  { id: "challenge_completer", name: "Challenge Completer", desc: "Finished the 3-day challenge", icon: "check-circle" },
  { id: "supporter", name: "Supporter", desc: "Boosted 5+ builders", icon: "heart", checkBoosts: 5 },
];

export function useBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await (supabase.from("badges") as any)
      .select("*")
      .eq("user_id", user.id);
    setBadges(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBadges(); }, [user]);

  const earnBadge = async (badgeId: string, name: string, description: string, icon: string) => {
    if (!user) return;
    if (badges.some(b => b.badge_id === badgeId)) return;

    const { data } = await (supabase.from("badges") as any)
      .insert({
        user_id: user.id,
        badge_id: badgeId,
        badge_name: name,
        badge_description: description,
        badge_icon: icon,
      })
      .select()
      .single();

    if (data) {
      setBadges(prev => [...prev, data]);
    }
  };

  const checkAndAwardBadges = async (directReferrals: number, completed: boolean, boostsGiven: number) => {
    if (!user) return;
    const existing = new Set(badges.map(b => b.badge_id));

    for (const def of BADGE_DEFS) {
      if (existing.has(def.id)) continue;

      let earned = false;
      if (def.id === "early_adopter" && def.check) earned = def.check();
      if ("checkReferrals" in def && directReferrals >= (def.checkReferrals || 0)) earned = true;
      if (def.id === "challenge_completer" && completed) earned = true;
      if ("checkBoosts" in def && boostsGiven >= (def.checkBoosts || 0)) earned = true;

      if (earned) {
        await earnBadge(def.id, def.name, def.desc, def.icon);
      }
    }
  };

  return { badges, loading, earnBadge, checkAndAwardBadges, refetch: fetchBadges, BADGE_DEFS };
}
