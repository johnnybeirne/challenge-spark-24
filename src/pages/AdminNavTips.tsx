import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import { invalidateNavTips, NavTip } from "@/hooks/useNavTips";

/** Hover Tips — hover-only tooltips (records with in_tour = false). */
const AdminNavTips = () => {
  const [rows, setRows] = useState<NavTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nav_tips")
        .select("*")
        .eq("in_tour", false)
        .order("sort_order");
      if (data) {
        const seen = new Set<string>();
        setRows(
          (data as NavTip[]).filter((r) => {
            if (seen.has(r.key)) return false;
            seen.add(r.key);
            return true;
          }),
        );
      }
      setLoading(false);
    })();
  }, []);

  const update = (key: string, tip: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, tip } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        const { error } = await supabase.from("nav_tips").update({ tip: r.tip }).eq("id", r.id);
        if (error) throw error;
      }
      invalidateNavTips();
      toast.success("Hover tips saved");
    } catch (e: any) {
      toast.error("Could not save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Hover Tips"
        description="The tooltips a participant sees when they hover a nav or sidebar item. These never appear in the first-run walkthrough. Leave a tip blank to hide it."
      />

      <EditorCard
        title="Hover-only tooltips"
        description="Shown on hover only. Leave blank to hide the tooltip."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hover tips yet.</p>
        ) : (
          rows.map((r) => (
            <EditableField
              key={r.id}
              label={r.label}
              helper={`Key: ${r.key}`}
              multiline
              rows={2}
              value={r.tip}
              onChange={(v) => update(r.key, v)}
            />
          ))
        )}
      </EditorCard>

      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>
  );
};

export default AdminNavTips;
