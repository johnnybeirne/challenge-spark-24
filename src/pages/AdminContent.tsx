import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  ExternalLink,
  Check,
  RefreshCw,
  Monitor,
  Smartphone,
  Settings2,
  GripVertical,
} from "lucide-react";
import { invalidatePage, type SiteContentRow } from "@/hooks/useSiteContent";
import { Link } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PAGES: { id: string; label: string; previewUrl: string; description: string }[] = [
  { id: "landing", label: "Landing", previewUrl: "/", description: "Public landing page" },
  { id: "signup", label: "Signup", previewUrl: "/join", description: "Account creation" },
  { id: "results", label: "Results", previewUrl: "/results", description: "Diagnostic results copy" },
  { id: "dashboard", label: "Dashboard", previewUrl: "/challenger-dashboard", description: "Authenticated dashboard" },
  { id: "unlocks", label: "Unlocks", previewUrl: "/unlocks", description: "Unlocks page copy" },
  { id: "rewards", label: "Rewards", previewUrl: "/bonus-vault", description: "Rewards page copy" },
  { id: "referrals", label: "Referrals", previewUrl: "/referrals", description: "Referrals page copy" },
];

// Maps DB section id -> friendly label + "where it appears" hint + iframe anchor.
// Anchors must match the `id="..."` wrappers in src/pages/Landing.tsx.
const SECTION_META: Record<string, Record<string, { label: string; hint: string; anchor: string }>> = {
  landing: {
    hero: { label: "Hero", hint: "Top of page — main headline, subhead, primary button.", anchor: "hero" },
    problem: { label: "Problem", hint: "“Lead flow should not feel like guesswork” band.", anchor: "problem" },
    reveal: { label: "What the quiz reveals", hint: "Two-column reveal section.", anchor: "reveal" },
    score: { label: "Score preview", hint: "Donut chart + result list.", anchor: "score" },
    benefits: { label: "Benefits", hint: "Four-up benefits grid.", anchor: "benefits" },
    authority: { label: "Authority card", hint: "“Built for people who need leads…” centered card.", anchor: "authority" },
    faq: { label: "FAQ", hint: "Accordion of questions and answers.", anchor: "faq" },
    cta: { label: "Final CTA", hint: "Bottom call-to-action band.", anchor: "cta" },
    sticky: { label: "Sticky bottom bar", hint: "Persistent bar pinned to the bottom of the page.", anchor: "cta" },
  },
};

const sectionMeta = (page: string, section: string) =>
  SECTION_META[page]?.[section];

type Draft = SiteContentRow & { _dirty?: boolean; _new?: boolean; column_slot?: "full" | "left" | "right" };

const sectionTitle = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const friendlyLabel = (row: Draft) => {
  if (row.label && row.label.trim()) return row.label;
  return row.key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const AdminContent = () => {
  const [activePage, setActivePage] = useState<string>(PAGES[0].id);
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // When the selected section changes, scroll the preview iframe to its anchor.
  // We mutate the iframe's hash directly to avoid a full reload.
  useEffect(() => {
    if (!activeSection) return;
    const meta = sectionMeta(activePage, activeSection);
    if (!meta) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.location.hash = `#${meta.anchor}`;
    } catch {
      /* cross-origin or not ready — ignore */
    }
  }, [activeSection, activePage, previewNonce]);

  const load = async (page: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_content")
      .select("*")
      .eq("page", page)
      .order("section")
      .order("sort_order");
    setLoading(false);
    if (error) {
      toast.error("Failed to load content", { description: error.message });
      return;
    }
    setRows((data ?? []) as Draft[]);
  };

  useEffect(() => {
    load(activePage);
    setPreviewNonce((n) => n + 1);
  }, [activePage]);

  // Custom section order persisted in a meta row: section='_meta', key='section_order'.
  const orderRow = useMemo(
    () => rows.find((r) => r.section === "_meta" && r.key === "section_order"),
    [rows]
  );
  const customOrder = useMemo<string[]>(() => {
    if (!orderRow?.value) return [];
    try {
      const v = JSON.parse(orderRow.value);
      return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }, [orderRow]);

  const grouped = useMemo(() => {
    const g: Record<string, Draft[]> = {};
    for (const r of rows) {
      if (r.section === "_meta") continue; // hide meta rows from the editor
      g[r.section] ??= [];
      g[r.section].push(r);
    }
    // Section order priority:
    // 1. Persisted custom order (drag-and-drop result)
    // 2. SECTION_META declaration order (matches live page)
    // 3. Alphabetical fallback for anything else
    const knownOrder = Object.keys(SECTION_META[activePage] ?? {});
    const orderIndex = (name: string) => {
      const c = customOrder.indexOf(name);
      if (c !== -1) return [0, c] as const;
      const k = knownOrder.indexOf(name);
      if (k !== -1) return [1, k] as const;
      return [2, 0] as const;
    };
    const ordered: Record<string, Draft[]> = {};
    Object.keys(g)
      .sort((a, b) => {
        const [ag, ai] = orderIndex(a);
        const [bg, bi] = orderIndex(b);
        if (ag !== bg) return ag - bg;
        if (ai !== bi) return ai - bi;
        return a.localeCompare(b);
      })
      .forEach((k) => {
        ordered[k] = g[k];
      });
    return ordered;
  }, [rows, activePage, customOrder]);

  const sectionIds = useMemo(() => Object.keys(grouped), [grouped]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const persistOrder = async (order: string[]) => {
    const payload = {
      page: activePage,
      section: "_meta",
      key: "section_order",
      value: JSON.stringify(order),
      value_type: "json",
      label: "Section order",
      sort_order: 0,
    };
    if (orderRow) {
      const { error } = await supabase
        .from("site_content")
        .update({ value: payload.value })
        .eq("id", orderRow.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("site_content").insert(payload);
      if (error) return toast.error(error.message);
    }
    invalidatePage(activePage);
    await load(activePage);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionIds.indexOf(String(active.id));
    const newIndex = sectionIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(sectionIds, oldIndex, newIndex);
    // Optimistically reflect the new order by writing a synthetic meta row
    // into local state so the UI updates before the network round-trip.
    setRows((rs) => {
      const without = rs.filter((r) => !(r.section === "_meta" && r.key === "section_order"));
      const fake: Draft = {
        id: orderRow?.id ?? `meta-${Date.now()}`,
        page: activePage,
        section: "_meta",
        key: "section_order",
        value: JSON.stringify(next),
        value_type: "json",
        label: "Section order",
        sort_order: 0,
      } as Draft;
      return [...without, fake];
    });
    void persistOrder(next);
  };




  const updateRow = (id: string, patch: Partial<Draft>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));

  const removeRow = async (row: Draft) => {
    if (row._new) {
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm(`Delete "${friendlyLabel(row)}"?`)) return;
    const { error } = await supabase.from("site_content").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    invalidatePage(activePage);
    setPreviewNonce((n) => n + 1);
    toast.success("Deleted");
  };

  const addRow = (section: string) => {
    const tmpId = `new-${Date.now()}`;
    setRows((rs) => [
      ...rs,
      {
        id: tmpId,
        page: activePage,
        section,
        key: "new_key",
        value: "",
        value_type: "text",
        label: "",
        sort_order: 99,
        column_slot: "full",
        _dirty: true,
        _new: true,
      } as Draft,
    ]);
  };

  const addSection = () => {
    const name = prompt("New section name (e.g. 'features', 'testimonials')")?.trim();
    if (!name) return;
    addRow(name);
  };

  const saveAll = async () => {
    const dirty = rows.filter((r) => r._dirty);
    if (dirty.length === 0) {
      toast("Nothing to save");
      return;
    }
    setSaving(true);
    let ok = 0;
    let fail = 0;
    for (const r of dirty) {
      if (r._new) {
        const { error } = await supabase.from("site_content").insert({
          page: r.page,
          section: r.section,
          key: r.key,
          value: r.value,
          value_type: r.value_type,
          label: r.label,
          sort_order: r.sort_order,
          column_slot: r.column_slot ?? "full",
        });
        if (error) { fail++; toast.error(`${r.section}.${r.key}: ${error.message}`); }
        else ok++;
      } else {
        const { error } = await supabase
          .from("site_content")
          .update({
            key: r.key,
            value: r.value,
            value_type: r.value_type,
            label: r.label,
            sort_order: r.sort_order,
            column_slot: r.column_slot ?? "full",
          })
          .eq("id", r.id);
        if (error) { fail++; toast.error(`${r.section}.${r.key}: ${error.message}`); }
        else ok++;
      }
    }
    setSaving(false);
    if (ok) {
      toast.success(`Saved ${ok} change${ok === 1 ? "" : "s"}`);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1800);
    }
    invalidatePage(activePage);
    await load(activePage);
    setPreviewNonce((n) => n + 1);
  };

  const dirtyCount = rows.filter((r) => r._dirty).length;
  const currentPage = PAGES.find((p) => p.id === activePage)!;
  const previewSrc = `${currentPage.previewUrl}${currentPage.previewUrl.includes("?") ? "&" : "?"}cms=${previewNonce}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/20">
      {/* Top bar: page tabs + actions */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-semibold shrink-0">Content Editor</h1>
            <Tabs value={activePage} onValueChange={setActivePage}>
              <TabsList className="h-8">
                {PAGES.map((p) => (
                  <TabsTrigger key={p.id} value={p.id} className="text-xs h-7 px-3">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="h-8">
              <Link to={currentPage.previewUrl} target="_blank">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Split pane: editor | preview */}
      <div className="flex-1 flex min-h-0">
        {/* Left: editor */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 border-r bg-background flex flex-col">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate">{currentPage.label}</h2>
                <p className="text-xs text-muted-foreground truncate">{currentPage.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={addSection} className="h-8 shrink-0">
                <Plus className="h-3.5 w-3.5 mr-1" /> Section
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No content yet for this page.
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add a section
                  </Button>
                </div>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                  <Accordion
                    type="single"
                    collapsible
                    value={activeSection ?? undefined}
                    onValueChange={(v) => setActiveSection(v || null)}
                    className="space-y-2"
                  >
                    {Object.entries(grouped).map(([section, items]) => {
                      const sectionDirty = items.some((r) => r._dirty);
                      const meta = sectionMeta(activePage, section);
                      const friendly = meta?.label ?? sectionTitle(section);
                      return (
                        <SortableSection key={section} id={section}>
                          {(handleProps) => (
                            <AccordionItem
                              value={section}
                              className="rounded-lg border bg-card pl-1 pr-3 data-[state=open]:border-primary/60"
                            >
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  aria-label="Drag to reorder"
                                  className="flex h-8 w-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
                                  {...handleProps}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                                <AccordionTrigger className="flex-1 hover:no-underline py-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-semibold">{friendly}</span>
                                    <Badge variant="secondary" className="h-5 text-[10px]">
                                      {items.length}
                                    </Badge>
                                    {sectionDirty && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="unsaved" />
                                    )}
                                  </div>
                                </AccordionTrigger>
                              </div>
                              <AccordionContent className="pb-3 space-y-3">
                                {meta?.hint && (
                                  <p className="text-xs text-muted-foreground italic">
                                    Appears in preview as: {meta.hint}
                                  </p>
                                )}
                                <SectionFieldsGrid
                                  items={items}
                                  onUpdate={(id, p) => updateRow(id, p)}
                                  onRemove={(row) => removeRow(row)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addRow(section)}
                                  className="w-full justify-start text-xs h-8"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Add field
                                </Button>
                              </AccordionContent>
                            </AccordionItem>
                          )}
                        </SortableSection>
                      );
                    })}
                  </Accordion>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Save bar */}
          <div className="border-t bg-background px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
              {justSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Saved</span>
                </>
              ) : dirtyCount > 0 ? (
                <span>{dirtyCount} unsaved</span>
              ) : (
                <span>All saved</span>
              )}
            </div>
            <Button onClick={saveAll} disabled={saving || dirtyCount === 0} size="sm" className="h-9">
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save
              {dirtyCount > 0 && <Badge variant="secondary" className="ml-2">{dirtyCount}</Badge>}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0">
          <div className="px-4 py-2 border-b bg-background flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
              <span>
                Editing: <span className="font-semibold text-foreground">{currentPage.label}</span>
                {activeSection && (
                  <>
                    {" / "}
                    <span className="font-semibold text-foreground">
                      {sectionMeta(activePage, activeSection)?.label ?? sectionTitle(activeSection)}
                    </span>
                  </>
                )}
              </span>
              <span className="font-mono opacity-60">{currentPage.previewUrl}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={device === "desktop" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setDevice("desktop")}
                title="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={device === "mobile" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setDevice("mobile")}
                title="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPreviewNonce((n) => n + 1)}
                title="Reload preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-muted/40 p-4 flex justify-center">
            <div
              className="bg-background shadow-lg rounded-md overflow-hidden border transition-all"
              style={{
                width: device === "mobile" ? 390 : "100%",
                maxWidth: device === "mobile" ? 390 : 1280,
                height: "100%",
              }}
            >
              <iframe
                ref={iframeRef}
                key={previewNonce}
                src={previewSrc}
                title="Page preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SortableSection({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}


function FieldRow({
  row,
  onUpdate,
  onRemove,
}: {
  row: Draft;
  onUpdate: (p: Partial<Draft>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-md border p-3 space-y-2 transition-colors ${
        row._dirty ? "border-primary/50 bg-primary/5" : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground truncate">
          {friendlyLabel(row)}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</label>
                <Input
                  value={row.label ?? ""}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder={friendlyLabel(row)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Key</label>
                  <Input
                    value={row.key}
                    onChange={(e) => onUpdate({ key: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</label>
                  <select
                    value={row.value_type}
                    onChange={(e) => onUpdate({ value_type: e.target.value })}
                    className="h-8 w-full text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="text">Short text</option>
                    <option value="textarea">Long text</option>
                    <option value="url">URL</option>
                    <option value="image">Image URL</option>
                  </select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {row.value_type === "textarea" ? (
        <Textarea
          value={row.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          rows={3}
          className="text-sm leading-relaxed"
        />
      ) : (
        <Input
          value={row.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="h-9 text-sm"
          type={row.value_type === "url" ? "url" : "text"}
        />
      )}
    </div>
  );
}

export default AdminContent;
