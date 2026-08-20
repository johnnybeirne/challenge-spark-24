import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CmsPageHeader, EditorCard, EditableField } from "@/components/cms/cms-ui";
import { AdminPageTag, invalidateAdminPageTags } from "@/hooks/useAdminPageTags";

/** Menu Search Tags — owner-editable keywords that power the admin sidebar search. */
const AdminMenuTags = () => {
  const [rows, setRows] = useState<AdminPageTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("admin_page_tags")
        .select("page_key,label,tags")
        .order("label");
      if (!error && data) setRows(data as AdminPageTag[]);
      setLoading(false);
    })();
  }, []);

  const update = (key: string, tags: string) =>
    setRows((prev) => prev.map((r) => (r.page_key === key ? { ...r, tags } : r)));

  const save = async (row: AdminPageTag) => {
    setSavingKey(row.page_key);
    const { error } = await supabase
      .from("admin_page_tags")
      .update({ tags: row.tags })
      .eq("page_key", row.page_key);
    setSavingKey(null);
    if (error) {
      toast.error("Could not save: " + error.message);
      return;
    }
    invalidateAdminPageTags();
    toast.success("Tags saved");
  };

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((r) =>
        `${r.label} ${r.page_key} ${r.tags}`.toLowerCase().includes(q),
      )
    : rows;

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Menu Search Tags"
        description="Keywords that make each console page findable from the sidebar search box. Use plain language, separated by commas. Add your own words any time."
      />

      <EditorCard
        title="Pages and their keywords"
        description="Edit the keywords for a page, then press Save on that page."
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter this list..."
          aria-label="Filter pages"
          className="mb-4 h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pages match.</p>
        ) : (
          <div className="space-y-4">
            {visible.map((r) => (
              <div key={r.page_key} className="rounded-md border p-3">
                <EditableField
                  label={r.label || r.page_key}
                  helper={r.page_key}
                  multiline
                  rows={2}
                  value={r.tags}
                  onChange={(v) => update(r.page_key, v)}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => save(r)}
                    disabled={savingKey === r.page_key}
                  >
                    {savingKey === r.page_key ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorCard>
    </div>
  );
};

export default AdminMenuTags;
