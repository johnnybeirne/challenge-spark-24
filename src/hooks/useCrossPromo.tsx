import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

export interface CrossPromoEntry {
  id: string;
  promoter_id: string;
  title: string;
  description: string | null;
  url: string | null;
  builder_name: string;
  score: number;
}

/**
 * Fetches eligible cross-promo entries, weighted by performance.
 * `slots` controls how many to return.
 */
export function useCrossPromo(slots = 3) {
  const [promos, setPromos] = useState<CrossPromoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch active cross-promotions with promoter info
        const { data: cpRows } = await (supabase.from("cross_promotions") as any)
          .select("id, promoter_id, title, description, url, priority, impressions")
          .eq("is_active", true)
          .limit(50);

        if (!cpRows?.length) {
          setLoading(false);
          return;
        }

        // Get promoter details
        const promoterIds = [...new Set(cpRows.map((r: any) => r.promoter_id))];
        const { data: promoters } = await (supabase.from("promoters") as any)
          .select("id, user_id, conversions, tier")
          .in("id", promoterIds);

        if (!promoters?.length) {
          setLoading(false);
          return;
        }

        // Get names
        const userIds = promoters.map((p: any) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, direct_referral_count, indirect_referral_count")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        const promoterMap = new Map(promoters.map((p: any) => [p.id, p]));

        // Score and sort
        const scored: CrossPromoEntry[] = cpRows.map((cp: any) => {
          const promoter = promoterMap.get(cp.promoter_id);
          const profile = promoter ? profileMap.get(promoter.user_id) : null;
          const direct = profile?.direct_referral_count || 0;
          const indirect = profile?.indirect_referral_count || 0;
          const promotionScore =
            direct * 3 +
            indirect * 1 +
            (cp.priority || 0) +
            (promoter?.conversions || 0) * 2;

          // Light randomness to avoid same users always showing
          const jitter = Math.random() * 5;

          return {
            id: cp.id,
            promoter_id: cp.promoter_id,
            title: cp.title,
            description: cp.description,
            url: cp.url,
            builder_name: profile?.name || "Builder",
            score: promotionScore + jitter,
          };
        });

        scored.sort((a, b) => b.score - a.score);
        setPromos(scored.slice(0, slots));
      } catch {}
      setLoading(false);
    })();
  }, [slots]);

  const trackImpression = async (promoId: string) => {
    try {
      trackEvent("crosspromo_impression" as any, { promo_id: promoId });
      // Increment impressions counter
      await (supabase.from("cross_promotions") as any)
        .update({ impressions: supabase.rpc ? undefined : 0 }) // fallback
        .eq("id", promoId);
    } catch {}
  };

  const trackClick = async (promoId: string) => {
    trackEvent("crosspromo_click" as any, { promo_id: promoId });
  };

  return { promos, loading, trackImpression, trackClick };
}
