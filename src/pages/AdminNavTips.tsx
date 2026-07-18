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

const AdminNavTips = () => {
  const [rows, setRows] = useState<NavTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nav_tips")
        .select("*")
        .order("sort_order");
      if (data) setRows(data as NavTip[]);
      setLoading(false);
    })();
  }, []);

  const update = (key: string, tip: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, tip } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        const { error } = await supabase
          .from("nav_tips")
          .update({ tip: r.tip })
          .eq("id", r.id);
        if (error) throw error;
      }
      invalidateNavTips();
      toast.success("Nav tips saved");
    } catch (e: any) {
      toast.error("Could not save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const tourItems = rows.filter((r) => r.in_tour);
  const otherItems = rows.filter((r) => !r.in_tour);

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Nav Tips"
        description="Edit the tip text for every navigation item. This copy powers both the hover tooltips and the first-run walkthrough — edit once and both surfaces update."
      />

      <EditorCard
        title="Top bar — included in the walkthrough"
        description="Shown as hover tooltips and as guided-tour popovers on a participant's first visit. Leave blank to hide."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          tourItems.map((r) => (
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

      <EditorCard
        title="Sidebar items — hover tooltips only"
        description="Shown as tooltips when a participant hovers on the item. Leave blank to hide the tooltip."
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          otherItems.map((r) => (
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
