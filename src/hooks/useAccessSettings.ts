import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_POINTS_THRESHOLD = 500;

export interface AccessSettings {
  pointsThreshold: number;
  loading: boolean;
}

/** Reads the single access_settings row (points threshold for free access). */
export const useAccessSettings = (): AccessSettings => {
  const [pointsThreshold, setPointsThreshold] = useState(DEFAULT_POINTS_THRESHOLD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase.from("access_settings") as any)
        .select("points_threshold")
        .limit(1)
        .maybeSingle();
      if (!active) return;
      const value = Number(data?.points_threshold);
      setPointsThreshold(Number.isFinite(value) && value > 0 ? value : DEFAULT_POINTS_THRESHOLD);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { pointsThreshold, loading };
};

export default useAccessSettings;
