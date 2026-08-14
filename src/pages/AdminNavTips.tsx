import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  StickyActionBar,
} from "@/components/cms/cms-ui";
import { invalidateNavTips, NavTip } from "@/hooks/useNavTips";

function SortableTipRow({
  tip,
  onChange,
}: {
  tip: NavTip;
  onChange: (value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tip.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-md border p-2 ${isDragging ? "opacity-70 shadow-md" : ""}`}
    >
      <button
        type="button"
        aria-label={`Reorder ${tip.label}`}
        className="mt-6 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <EditableField
          label={tip.label}
          helper={`Key: ${tip.key}`}
          multiline
          rows={2}
          value={tip.tip}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

const AdminNavTips = () => {
  const [rows, setRows] = useState<NavTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nav_tips")
        .select("*")
        .order("sort_order");
      if (data) {
        const all = data as NavTip[];
        // Dedupe: keep the first record for each key, remove the rest
        const seen = new Set<string>();
        const unique: NavTip[] = [];
        const duplicateIds: string[] = [];
        for (const r of all) {
          if (seen.has(r.key)) duplicateIds.push(r.id);
          else {
            seen.add(r.key);
            unique.push(r);
          }
        }
        if (duplicateIds.length > 0) {
          await supabase.from("nav_tips").delete().in("id", duplicateIds);
          invalidateNavTips();
        }
        setRows(unique);
      }
      setLoading(false);
    })();
  }, []);

  const update = (key: string, tip: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, tip } : r)));

  const tourItems = rows.filter((r) => r.in_tour);
  const otherItems = rows.filter((r) => !r.in_tour);

  const handleDragEnd = (group: NavTip[]) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = group.findIndex((g) => g.id === active.id);
    const newIndex = group.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(group, oldIndex, newIndex);
    // reuse the sort_order slots already owned by this group so groups stay separate
    const slots = group.map((g) => g.sort_order).sort((a, b) => a - b);
    const updates = new Map<string, number>();
    reordered.forEach((r, i) => updates.set(r.id, slots[i]));

    setRows((prev) =>
      prev
        .map((r) => (updates.has(r.id) ? { ...r, sort_order: updates.get(r.id)! } : r))
        .sort((a, b) => a.sort_order - b.sort_order),
    );

    (async () => {
      for (const [id, sort_order] of updates) {
        const { error } = await supabase.from("nav_tips").update({ sort_order }).eq("id", id);
        if (error) {
          toast.error("Could not save order: " + error.message);
          return;
        }
      }
      invalidateNavTips();
    })();
  };

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
      toast.success("User tour saved");
    } catch (e: any) {
      toast.error("Could not save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (group: NavTip[]) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(group)}>
      <SortableContext items={group.map((g) => g.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {group.map((r) => (
            <SortableTipRow key={r.id} tip={r} onChange={(v) => update(r.key, v)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="User Tour"
        description="Edit the tip text for every navigation item. This copy powers both the hover tooltips and the first-run user tour — edit once and both surfaces update. Drag the handle to change the order."
      />

      <EditorCard
        title="Top bar — included in the user tour"
        description="Shown as hover tooltips and as tour popovers on a participant's first visit. Drag to set the order the tour steps appear. Leave blank to hide."
      >
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : renderGroup(tourItems)}
      </EditorCard>

      <EditorCard
        title="Sidebar items — hover tooltips only"
        description="Shown as tooltips when a participant hovers on the item. Drag to reorder. Leave blank to hide the tooltip."
      >
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : renderGroup(otherItems)}
      </EditorCard>

      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>
  );
};

export default AdminNavTips;
