import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NavInfoPopover {
  id: string;
  section: string;
  label: string;
  title: string;
  body: string;
  enabled: boolean;
  sort_order: number;
}

let cache: NavInfoPopover[] | null = null;
const listeners = new Set<(rows: NavInfoPopover[]) => void>();

async function load() {
  const { data } = await supabase
    .from("nav_info_popovers")
    .select("*")
    .order("sort_order");
  if (data) {
    cache = data as NavInfoPopover[];
    listeners.forEach((l) => l(cache!));
  }
  return cache ?? [];
}

export function invalidateNavInfoPopovers() {
  cache = null;
  void load();
}

export function useNavInfoPopovers() {
  const [rows, setRows] = useState<NavInfoPopover[]>(cache ?? []);
  const [loaded, setLoaded] = useState<boolean>(!!cache);

  useEffect(() => {
    const setter = (r: NavInfoPopover[]) => {
      setRows(r);
      setLoaded(true);
    };
    listeners.add(setter);
    if (cache) setter(cache);
    else void load().then(() => setLoaded(true));
    return () => {
      listeners.delete(setter);
    };
  }, []);

  const bySection = (section: string): NavInfoPopover | null =>
    rows.find((r) => r.section === section) ?? null;

  return { rows, bySection, loaded };
}
