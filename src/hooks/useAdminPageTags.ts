import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminPageTag = {
  page_key: string;
  label: string;
  tags: string;
};

let cache: AdminPageTag[] | null = null;

export const invalidateAdminPageTags = () => {
  cache = null;
};

/** Owner-editable keyword tags used by the admin sidebar search. */
export function useAdminPageTags() {
  const [rows, setRows] = useState<AdminPageTag[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("admin_page_tags")
        .select("page_key,label,tags")
        .order("label");
      if (cancelled) return;
      if (!error && data) {
        cache = data as AdminPageTag[];
        setRows(cache);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading };
}

/** Map of page key (route) -> tag string, for quick lookup. */
export function tagsByKey(rows: AdminPageTag[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, r) => {
    acc[r.page_key] = r.tags ?? "";
    return acc;
  }, {});
}
