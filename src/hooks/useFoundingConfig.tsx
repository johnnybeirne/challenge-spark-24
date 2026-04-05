import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FoundingConfig {
  max_founders: number;
  cutoff_date: string | null;
}

export function useFoundingConfig() {
  const [config, setConfig] = useState<FoundingConfig | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [configRes, countRes] = await Promise.all([
          (supabase.from("founding_config") as any).select("*").limit(1).single(),
          (supabase.from("promoters") as any)
            .select("id", { count: "exact", head: true })
            .eq("is_founding_partner", true),
        ]);

        if (configRes.data) {
          setConfig({
            max_founders: configRes.data.max_founders,
            cutoff_date: configRes.data.cutoff_date,
          });
        }
        setCurrentCount(countRes.count || 0);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const slotsRemaining = config ? Math.max(0, config.max_founders - currentCount) : 0;

  return { config, currentCount, slotsRemaining, loading };
}
