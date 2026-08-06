import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** The three access-page instances that share one template. */
export type AccessPageKey = "training" | "community" | "events";

export type AccessPageItem = {
  icon: string;
  heading: string;
  copy: string;
  /** Single source of truth for display order — ascending. */
  position: number;
};

/** Re-number a list so positions are 0..n-1 in the given array order. */
export function withPositions(items: AccessPageItem[]): AccessPageItem[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

export type AccessPageContent = {
  id: string;
  page_key: AccessPageKey;
  header_text: string;
  intro_text: string;
  referral_heading: string;
  referral_copy: string;
  items: AccessPageItem[];
};

export const ACCESS_PAGE_LABELS: Record<AccessPageKey, string> = {
  training: "Training",
  community: "Community",
  events: "Events",
};

export const ACCESS_PAGE_ROUTES: Record<AccessPageKey, string> = {
  training: "/training",
  community: "/community",
  events: "/calendar",
};

function normalise(row: any): AccessPageContent {
  const rawItems = Array.isArray(row?.items) ? row.items : [];
  return {
    id: row.id,
    page_key: row.page_key,
    header_text: row.header_text ?? "",
    intro_text: row.intro_text ?? "",
    referral_heading: row.referral_heading ?? "",
    referral_copy: row.referral_copy ?? "",
    items: rawItems
      .map((i: any, index: number) => ({
        icon: String(i?.icon ?? "Sparkles"),
        heading: String(i?.heading ?? ""),
        copy: String(i?.copy ?? ""),
        position: Number.isFinite(Number(i?.position)) ? Number(i.position) : index,
      }))
      .sort((a, b) => a.position - b.position)
      .map((item, index) => ({ ...item, position: index })),
  };
}

/** Fetch a single access page instance's owner-editable content. */
export function useAccessPage(pageKey: AccessPageKey) {
  const [content, setContent] = useState<AccessPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("access_pages")
      .select("*")
      .eq("page_key", pageKey)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setContent(data ? normalise(data) : null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  return { content, loading };
}

/** Fetch all three instances (admin editor). */
export function useAllAccessPages() {
  const [pages, setPages] = useState<AccessPageContent[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("access_pages").select("*").order("page_key");
    setPages((data ?? []).map(normalise));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { pages, setPages, loading, reload };
}
