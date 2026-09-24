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
  mobile_only?: boolean;
};

export type SiteContentMap = Record<string, string>; // "section.key" -> value

const cache = new Map<string, SiteContentMap>();
const rowsCache = new Map<string, SiteContentRow[]>();
const listeners = new Map<string, Set<(m: SiteContentMap, rows: SiteContentRow[]) => void>>();

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
  const [rows, setRows] = useState<SiteContentRow[]>(() => rowsCache.get(page) ?? []);
  const [loaded, setLoaded] = useState<boolean>(cache.has(page));

  useEffect(() => {
    let cancelled = false;
    if (!listeners.has(page)) listeners.set(page, new Set());
    const setter = (m: SiteContentMap, r: SiteContentRow[]) => {
      if (!cancelled) {
        setMap(m);
        setRows(r);
      }
    };
    listeners.get(page)!.add(setter);

    fetchPageContent(page)
      .then((fetched) => {
        const m = rowsToMap(fetched);
        cache.set(page, m);
        rowsCache.set(page, fetched);
        listeners.get(page)?.forEach((l) => l(m, fetched));
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

  return { t, map, rows, loaded };
}

export function invalidatePage(page: string) {
  cache.delete(page);
  rowsCache.delete(page);
  fetchPageContent(page).then((fetched) => {
    const m = rowsToMap(fetched);
    cache.set(page, m);
    rowsCache.set(page, fetched);
    listeners.get(page)?.forEach((l) => l(m, fetched));
  });
}
