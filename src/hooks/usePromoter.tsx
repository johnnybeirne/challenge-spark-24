import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PromoterRecord {
  id: string;
  user_id: string;
  partner_code: string;
  tier: string;
  is_approved: boolean;
  is_founding_partner: boolean;
  is_eligible_for_promotion: boolean;
  quality_score: number;
  founding_rank: number | null;
  founding_joined_at: string | null;
  conversions: number;
  assessment_starts: number;
  approved_at: string | null;
  created_at: string;
}

export function usePromoter() {
  const { user } = useAuth();
  const [promoter, setPromoter] = useState<PromoterRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPromoter = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await (supabase.from("promoters") as any)
        .select("*")
        .eq("user_id", user.id)
        .single();
      setPromoter(data || null);
    } catch {
      setPromoter(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPromoter(); }, [user]);

  const becomePromoter = async () => {
    if (!user) return null;
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "jv_";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const { data, error } = await (supabase.from("promoters") as any)
      .insert({ user_id: user.id, partner_code: code })
      .select()
      .single();

    if (!error && data) {
      setPromoter(data);
      return data;
    }
    return null;
  };

  return { promoter, loading, becomePromoter, refetch: fetchPromoter };
}
