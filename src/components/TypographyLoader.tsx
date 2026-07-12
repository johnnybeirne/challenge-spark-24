import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches typography_settings once and applies the four size values as
 * CSS variables (--h1-size, --h2-size, --h3-size, --body-size) on
 * the document root. Falls back silently to the CSS defaults on error.
 */
const TypographyLoader = () => {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("typography_settings" as any)
        .select("h1_size,h2_size,h3_size,body_size")
        .limit(1)
        .maybeSingle();
      if (cancelled || error || !data) return;
      const row = data as any;
      const root = document.documentElement;
      if (row.h1_size) root.style.setProperty("--h1-size", `${row.h1_size}px`);
      if (row.h2_size) root.style.setProperty("--h2-size", `${row.h2_size}px`);
      if (row.h3_size) root.style.setProperty("--h3-size", `${row.h3_size}px`);
      if (row.body_size) root.style.setProperty("--body-size", `${row.body_size}px`);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
};

export default TypographyLoader;
