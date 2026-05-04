import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteContentRow = {
  id: string;
  page: string;
  section: string;
  key: string;
  value: string;
  value_type: string;
  label: string | null;
  sort_order: number;
};

export type SiteContentMap = Record<string, string>; // "section.key" -> value

const cache = new Map<string, SiteContentMap>();
const listeners = new Map<string, Set<(m: SiteContentMap) => void>>();

export async function fetchPageContent(page: string): Promise<SiteContentRow[]> {
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", page)
    .order("section")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as SiteContentRow[];
}

function rowsToMap(rows: SiteContentRow[]): SiteContentMap {
  const m: SiteContentMap = {};
  for (const r of rows) m[`${r.section}.${r.key}`] = r.value;
  return m;
}

export function useSiteContent(page: string) {
  const [map, setMap] = useState<SiteContentMap>(() => cache.get(page) ?? {});
  const [loaded, setLoaded] = useState<boolean>(cache.has(page));

  useEffect(() => {
    let cancelled = false;
    if (!listeners.has(page)) listeners.set(page, new Set());
    const setter = (m: SiteContentMap) => {
      if (!cancelled) setMap(m);
    };
    listeners.get(page)!.add(setter);

    fetchPageContent(page)
      .then((rows) => {
        const m = rowsToMap(rows);
        cache.set(page, m);
        listeners.get(page)?.forEach((l) => l(m));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    return () => {
      cancelled = true;
      listeners.get(page)?.delete(setter);
    };
  }, [page]);

  const t = (sectionDotKey: string, fallback = "") =>
    map[sectionDotKey] ?? fallback;

  return { t, map, loaded };
}

export function invalidatePage(page: string) {
  cache.delete(page);
  fetchPageContent(page).then((rows) => {
    const m = rowsToMap(rows);
    cache.set(page, m);
    listeners.get(page)?.forEach((l) => l(m));
  });
}
