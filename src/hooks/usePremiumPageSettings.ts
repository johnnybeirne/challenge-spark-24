import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PremiumPageCard {
  title: string;
  description: string;
}

export interface PremiumPageSettings {
  id?: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_cta_label: string;
  hero_cta_url: string;
  hero_supporting_line: string;
  hero_stat_1: string;
  hero_stat_2: string;
  hero_stat_3: string;
  preview_title: string;
  preview_badge: string;
  preview_bullets: string[];
  price: number;
  coupon_enabled: boolean;
  problem_eyebrow: string;
  problem_headline: string;
  problem_cards: PremiumPageCard[];
  build_eyebrow: string;
  build_headline: string;
  build_subheadline: string;
  build_cards: PremiumPageCard[];
}

export const PREMIUM_PAGE_DEFAULTS: PremiumPageSettings = {
  hero_eyebrow: "LeadTree Growth Accelerator",
  hero_headline: "Turn your expertise into a challenge-based growth engine.",
  hero_subheadline:
    "The full LeadTree system — assessment-first funnels, AI-guided challenges, referral loops, and trust-based lead generation. Built to compound.",
  hero_cta_label: "Enrol Here",
  hero_cta_url: "",
  hero_supporting_line: "Lifetime access. One-time payment. 14-day refund.",
  hero_stat_1: "200+ Challenges",
  hero_stat_2: "12k+ Builders",
  hero_stat_3: "4.9/5 Rating",
  preview_title: "LeadTree Growth Accelerator",
  preview_badge: "Premium",
  preview_bullets: [
    "Assessment-first funnel design",
    "3-day challenge architecture",
    "AI-guided participant experience",
    "Referral and partner loops",
    "Trust-based lead conversion",
  ],
  price: 497,
  coupon_enabled: true,
  problem_eyebrow: "The Problem",
  problem_headline: "Most lead generation systems fail because trust is missing.",
  problem_cards: [
    { title: "Cold outreach burns bridges", description: "Prospects ignore generic pitches and unsubscribe fast." },
    { title: "Courses sit unfinished", description: "Information without implementation rarely creates change." },
    { title: "Referrals feel awkward", description: "Without a structured reason to share, people stay silent." },
    { title: "Leads do not convert", description: "Trust is earned through experience, not promises." },
    { title: "Growth stalls after launch", description: "Without compounding systems, momentum fades quickly." },
  ],
  build_eyebrow: "What You'll Build",
  build_headline: "A complete growth engine, not another course.",
  build_subheadline: "Four interlocking systems that compound on each other.",
  build_cards: [
    { title: "Assessment Funnel", description: "A diagnostic entry point that qualifies and pre-sells the right people." },
    { title: "Challenge Experience", description: "A time-bound, guided journey that turns strangers into engaged participants." },
    { title: "Referral Engine", description: "Built-in invite loops that reward sharing and multiply reach." },
    { title: "Partner System", description: "A promoter and JV layer that scales distribution without extra ad spend." },
  ],
};

export function usePremiumPageSettings() {
  const [settings, setSettings] = useState<PremiumPageSettings>(PREMIUM_PAGE_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("premium_page_settings" as any)
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data) {
          setSettings({ ...PREMIUM_PAGE_DEFAULTS, ...(data as any) });
        }
      } catch {
        // fall back to defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
