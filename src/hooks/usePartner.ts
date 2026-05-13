import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PartnerRow {
  id: string;
  user_id: string;
  slug: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string;
  default_commission_type: string;
  default_commission_value: number;
  default_l2_commission_type: string;
  default_l2_commission_value: number;
  manual_score_adjustment: number;
  parent_partner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttributionWithProfile {
  id: string;
  user_id: string;
  partner_id: string;
  parent_partner_id: string | null;
  partner_slug: string;
  source: string;
  first_touch_at: string;
  bound_at: string;
  landing_path: string | null;
  profile_name: string | null;
}

export interface SubPartner {
  id: string;
  slug: string;
  display_name: string | null;
  direct_count: number;
  created_at: string;
}

export interface PartnerTotals {
  direct: number;
  indirect: number;
  network: number;
  pendingCommissionsCents: number;
  approvedCommissionsCents: number;
  paidCommissionsCents: number;
  pendingPayoutCents: number;
  paidPayoutCents: number;
}

const ZERO_TOTALS: PartnerTotals = {
  direct: 0,
  indirect: 0,
  network: 0,
  pendingCommissionsCents: 0,
  approvedCommissionsCents: 0,
  paidCommissionsCents: 0,
  pendingPayoutCents: 0,
  paidPayoutCents: 0,
};

function fallbackName(userId: string) {
  return `Builder #${userId.slice(0, 8)}`;
}

export function usePartner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<PartnerRow | null>(null);
  const [attributions, setAttributions] = useState<AttributionWithProfile[]>([]);
  const [subAttributions, setSubAttributions] = useState<AttributionWithProfile[]>([]);
  const [subPartners, setSubPartners] = useState<SubPartner[]>([]);
  const [totals, setTotals] = useState<PartnerTotals>(ZERO_TOTALS);

  const ensurePartnerRow = useCallback(async (): Promise<PartnerRow | null> => {
    if (!user) return null;

    // 1. Try existing partners row
    const { data: existing } = await (supabase.from("partners") as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) return existing as PartnerRow;

    // 2. Backfill from promoters if available
    const { data: promoter } = await (supabase.from("promoters") as any)
      .select("partner_code")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!promoter?.partner_code) return null;

    const { data: created } = await (supabase.from("partners") as any)
      .insert({ user_id: user.id, slug: promoter.partner_code })
      .select()
      .maybeSingle();
    return (created as PartnerRow) || null;
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await ensurePartnerRow();
      setPartner(p);
      if (!p) {
        setAttributions([]);
        setSubAttributions([]);
        setSubPartners([]);
        setTotals(ZERO_TOTALS);
        return;
      }

      const [directRes, indirectRes, commRes, payoutRes, subPartnerRes] = await Promise.all([
        (supabase.from("referral_attributions") as any)
          .select("id,user_id,partner_id,parent_partner_id,partner_slug,source,first_touch_at,bound_at,landing_path")
          .eq("partner_id", p.id)
          .order("first_touch_at", { ascending: false }),
        (supabase.from("referral_attributions") as any)
          .select("id,user_id,partner_id,parent_partner_id,partner_slug,source,first_touch_at,bound_at,landing_path")
          .eq("parent_partner_id", p.id)
          .order("first_touch_at", { ascending: false }),
        (supabase.from("commissions") as any)
          .select("amount_cents,status,payout_id")
          .eq("partner_id", p.id),
        (supabase.from("payouts") as any)
          .select("total_cents,status")
          .eq("partner_id", p.id),
        (supabase.from("partners") as any)
          .select("id,slug,display_name,created_at")
          .eq("parent_partner_id", p.id),
      ]);

      const direct = (directRes.data || []) as any[];
      const indirect = (indirectRes.data || []) as any[];

      // Resolve names
      const allUserIds = Array.from(
        new Set([...direct.map((r) => r.user_id), ...indirect.map((r) => r.user_id)])
      );
      let nameMap = new Map<string, string>();
      if (allUserIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,name")
          .in("user_id", allUserIds);
        nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.name || ""]));
      }
      const decorate = (rows: any[]): AttributionWithProfile[] =>
        rows.map((r) => ({
          ...r,
          profile_name: nameMap.get(r.user_id) || fallbackName(r.user_id),
        }));

      setAttributions(decorate(direct));
      setSubAttributions(decorate(indirect));

      // Sub-partner direct counts
      const subRows = (subPartnerRes.data || []) as any[];
      let subWithCounts: SubPartner[] = subRows.map((s) => ({
        id: s.id,
        slug: s.slug,
        display_name: s.display_name,
        created_at: s.created_at,
        direct_count: 0,
      }));
      if (subRows.length) {
        const subIds = subRows.map((s) => s.id);
        const { data: subAttrs } = await (supabase.from("referral_attributions") as any)
          .select("partner_id")
          .in("partner_id", subIds);
        const counts = new Map<string, number>();
        (subAttrs || []).forEach((r: any) => {
          counts.set(r.partner_id, (counts.get(r.partner_id) || 0) + 1);
        });
        subWithCounts = subWithCounts.map((s) => ({
          ...s,
          direct_count: counts.get(s.id) || 0,
        }));
      }
      setSubPartners(subWithCounts);

      // Commission totals
      const comms = (commRes.data || []) as any[];
      const sumBy = (status: string) =>
        comms
          .filter((c) => c.status === status)
          .reduce((acc, c) => acc + (c.amount_cents || 0), 0);

      // Payout totals
      const payouts = (payoutRes.data || []) as any[];
      const sumPayout = (status: string) =>
        payouts
          .filter((p) => p.status === status)
          .reduce((acc, p) => acc + (p.total_cents || 0), 0);

      setTotals({
        direct: direct.length,
        indirect: indirect.length,
        network: direct.length + indirect.length,
        pendingCommissionsCents: sumBy("pending"),
        approvedCommissionsCents: sumBy("approved"),
        paidCommissionsCents: sumBy("paid"),
        pendingPayoutCents: sumPayout("pending"),
        paidPayoutCents: sumPayout("paid"),
      });
    } finally {
      setLoading(false);
    }
  }, [user, ensurePartnerRow]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const shareLink = partner?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/assess?ref=${partner.slug}`
    : "";

  return {
    loading,
    partner,
    shareLink,
    attributions,
    subAttributions,
    subPartners,
    totals,
    refresh: fetchAll,
  };
}
