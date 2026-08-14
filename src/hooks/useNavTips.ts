import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NavTip {
  id: string;
  key: string;
  label: string;
  tip: string;
  sort_order: number;
  in_tour: boolean;
}

let cache: NavTip[] | null = null;
const listeners = new Set<(tips: NavTip[]) => void>();

async function load() {
  const { data } = await supabase
    .from("nav_tips")
    .select("*")
    .order("sort_order");
  if (data) {
    // one row per key: keep the first (lowest position) record
    const seen = new Set<string>();
    cache = (data as NavTip[]).filter((r) => {
      if (seen.has(r.key)) return false;
      seen.add(r.key);
      return true;
    });
    listeners.forEach((l) => l(cache!));
  }
}

export function invalidateNavTips() {
  cache = null;
  load();
}

export function useNavTips() {
  const [tips, setTips] = useState<NavTip[]>(cache ?? []);
  const [loaded, setLoaded] = useState<boolean>(!!cache);

  useEffect(() => {
    const setter = (t: NavTip[]) => {
      setTips(t);
      setLoaded(true);
    };
    listeners.add(setter);
    if (cache) {
      setter(cache);
    } else {
      load().then(() => setLoaded(true));
    }
    return () => {
      listeners.delete(setter);
    };
  }, []);

  const byKey = (key: string): string => {
    const t = tips.find((x) => x.key === key);
    return t?.tip ?? "";
  };

  return { tips, byKey, loaded };
}
