import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ExternalLink } from "lucide-react";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import {
  invalidateNavInfoPopovers,
  NavInfoPopover,
} from "@/hooks/useNavInfoPopovers";

const AdminNavInfoPopovers = () => {
  const [rows, setRows] = useState<NavInfoPopover[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nav_info_popovers")
        .select("*")
        .order("sort_order");
      if (data) setRows(data as NavInfoPopover[]);
      setLoading(false);
    })();
  }, []);

  const update = (id: string, patch: Partial<NavInfoPopover>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        const { error } = await supabase
          .from("nav_info_popovers")
          .update({ title: r.title, body: r.body, enabled: r.enabled })
          .eq("id", r.id);
        if (error) throw error;
      }
      invalidateNavInfoPopovers();
      toast.success("Info popovers saved");
    } catch (e: any) {
      toast.error("Could not save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 px-6 py-6">
      <CmsPageHeader
        title="Nav info popovers"
        description="The small question mark beside Training, Community and Events in the top bar. Write a short title and a plain description of what each section is for. Turn one off to hide its question mark."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        rows.map((r) => (
          <EditorCard key={r.id} title={r.label}>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Show this question mark</p>
                <p className="text-xs text-muted-foreground">
                  Turn off to hide the icon beside {r.label}.
                </p>
              </div>
              <Switch
                checked={r.enabled}
                onCheckedChange={(v) => update(r.id, { enabled: v })}
              />
            </div>
            <EditableField
              label="Popover title"
              value={r.title}
              placeholder={`What is ${r.label}?`}
              onChange={(v) => update(r.id, { title: v })}
            />
            <EditableField
              label="Popover text"
              helper="A short plain description of what this section is for."
              multiline
              rows={4}
              value={r.body}
              onChange={(v) => update(r.id, { body: v })}
            />
          </EditorCard>
        ))
      )}

      <StickyActionBar
        onSave={handleSave}
        saving={saving}
        rightExtra={
          <Button
            variant="outline"
            className="h-10"
            onClick={() => window.open("/training", "_blank", "noopener")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview
          </Button>
        }
      />
    </div>
  );
};

export default AdminNavInfoPopovers;
