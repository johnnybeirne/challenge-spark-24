import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PremiumUpsellSettings {
  id?: string;
  heading: string;
  body_text: string;
  price: number;
  invite_count: number;
  button_label: string;
  button_sublabel: string;
  upgrade_link_label: string;
  upgrade_url: string;
}

export const PREMIUM_UPSELL_DEFAULTS: PremiumUpsellSettings = {
  heading: "Want to go deeper on quiz funnel strategy?",
  body_text: "",
  price: 497,
  invite_count: 3,
  button_label: "Check Out LeadTree Premium Membership",
  button_sublabel: "",
  upgrade_link_label: "",
  upgrade_url: "/training",
};

export function usePremiumUpsellSettings() {
  const [settings, setSettings] = useState<PremiumUpsellSettings>(PREMIUM_UPSELL_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("premium_upsell_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        setSettings(data as PremiumUpsellSettings);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
