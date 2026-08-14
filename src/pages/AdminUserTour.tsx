import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import { invalidateNavTips, NavTip } from "@/hooks/useNavTips";

/** User Tour Walkthrough — first-run guided tour steps (records with in_tour = true). */
const AdminUserTour = () => {
  const [rows, setRows] = useState<NavTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nav_tips")
        .select("*")
        .eq("in_tour", true)
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

  const ordered = useMemo(
    () =>
      [...rows].sort(
        (a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key),
      ),
    [rows],
  );

  const update = (id: string, patch: Partial<NavTip>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(rows.map((r) => [r.id, value])));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        const { error } = await supabase
          .from("nav_tips")
          .update({ tip: r.tip, sort_order: r.sort_order })
          .eq("id", r.id);
        if (error) throw error;
      }
      invalidateNavTips();
      toast.success("Walkthrough saved");
    } catch (e: any) {
      toast.error("Could not save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="User Tour Walkthrough"
        description="The guided popover steps a participant sees on their first visit. Steps fire in ascending order of the step number you set here. Leave a tip blank to skip that step."
      />

      <EditorCard
        title="Walkthrough steps"
        description="Type a step number to set the order. Click a row to expand and edit its copy."
      >
        <div className="mb-3 flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAll(true)}>
            Expand all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll(false)}>
            Collapse all
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-2">
            {ordered.map((r) => {
              const expanded = !!open[r.id];
              return (
                <div key={r.id} className="rounded-md border">
                  <div className="flex items-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setOpen((p) => ({ ...p, [r.id]: !expanded }))}
                      aria-expanded={expanded}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-sm font-medium">{r.label}</span>
                      <span className="truncate text-xs text-muted-foreground">{r.key}</span>
                      {!r.tip.trim() && (
                        <span className="shrink-0 text-xs text-muted-foreground">(hidden)</span>
                      )}
                    </button>
                    <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      Step
                      <input
                        type="number"
                        value={r.sort_order}
                        onChange={(e) =>
                          update(r.id, { sort_order: Number(e.target.value) || 0 })
                        }
                        className="h-8 w-16 rounded-md border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label={`Step number for ${r.label}`}
                      />
                    </label>
                  </div>
                  {expanded && (
                    <div className="border-t p-3">
                      <EditableField
                        label={r.label}
                        helper={`Key: ${r.key}`}
                        multiline
                        rows={3}
                        value={r.tip}
                        onChange={(v) => update(r.id, { tip: v })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </EditorCard>

      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>
  );
};

export default AdminUserTour;
