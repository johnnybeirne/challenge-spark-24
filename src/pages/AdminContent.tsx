import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, ExternalLink, Check } from "lucide-react";
import { invalidatePage, type SiteContentRow } from "@/hooks/useSiteContent";
import { Link } from "react-router-dom";
import {
  CmsPageHeader,
  EditorCard,
  FieldLabel,
  AdvancedDetails,
} from "@/components/cms/cms-ui";

const PAGES: { id: string; label: string; previewUrl?: string; description: string }[] = [
  { id: "landing", label: "Landing", previewUrl: "/", description: "Public landing page hero, social proof, FAQ" },
  { id: "signup", label: "Signup (/join)", previewUrl: "/join", description: "Account creation page" },
  { id: "results", label: "Results", previewUrl: "/results", description: "Static surrounding copy on the diagnostic results page" },
  { id: "dashboard", label: "Dashboard", previewUrl: "/user-dashboard", description: "Authenticated user dashboard" },
  { id: "challenge", label: "Challenge Days", previewUrl: "/day/1", description: "Day 1, 2, and 3 titles and intros" },
  { id: "unlocks", label: "Unlocks", previewUrl: "/unlocks", description: "Unlocks page copy" },
  { id: "rewards", label: "Rewards", previewUrl: "/rewards", description: "Rewards page copy" },
  { id: "referrals", label: "Referrals", previewUrl: "/referrals", description: "Referrals page copy" },
];

type Draft = SiteContentRow & { _dirty?: boolean; _new?: boolean };

const sectionTitle = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const friendlyLabel = (row: Draft) => {
  if (row.label && row.label.trim()) return row.label;
  return row.key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const AdminContent = () => {
  const [activePage, setActivePage] = useState<string>(PAGES[0].id);
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

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
  }, [activePage]);

  const grouped = useMemo(() => {
    const g: Record<string, Draft[]> = {};
    for (const r of rows) {
      g[r.section] ??= [];
      g[r.section].push(r);
    }
    return g;
  }, [rows]);

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
    load(activePage);
  };

  const dirtyCount = rows.filter((r) => r._dirty).length;
  const currentPage = PAGES.find((p) => p.id === activePage)!;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Page picker */}
      <aside className="lg:w-60 shrink-0">
        <div className="sticky top-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Pages
          </h2>
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activePage === p.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Content editor */}
      <div className="flex-1 min-w-0 space-y-5 pb-24">
        <CmsPageHeader title={currentPage.label} description={currentPage.description} />

        <div className="flex flex-wrap items-center gap-2">
          {currentPage.previewUrl && (
            <Button variant="outline" size="sm" asChild>
              <Link to={currentPage.previewUrl} target="_blank">
                <ExternalLink className="h-4 w-4 mr-1.5" /> Preview live page
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4 mr-1.5" /> New section
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <EditorCard title="No content yet" description="Add a section to start editing this page.">
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-1.5" /> Add a section
            </Button>
          </EditorCard>
        ) : (
          Object.entries(grouped).map(([section, items]) => (
            <EditorCard
              key={section}
              title={sectionTitle(section)}
              description={`${items.length} editable item${items.length === 1 ? "" : "s"} in this section.`}
              action={
                <Button variant="ghost" size="sm" onClick={() => addRow(section)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add content block
                </Button>
              }
            >
              {items.map((row) => (
                <div
                  key={row.id}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    row._dirty ? "border-primary/50 bg-primary/5" : "bg-background/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <Input
                        value={row.label ?? ""}
                        onChange={(e) => updateRow(row.id, { label: e.target.value })}
                        placeholder={friendlyLabel(row)}
                        className="h-9 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-foreground placeholder:font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        Appears in the <span className="font-medium">{sectionTitle(section)}</span> section of{" "}
                        <span className="font-medium">{currentPage.label}</span>.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {row._dirty && (
                        <Badge variant="secondary" className="text-[10px] h-5">Unsaved</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {row.value_type === "textarea" ? (
                    <Textarea
                      value={row.value}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      rows={4}
                      className="text-base leading-relaxed"
                    />
                  ) : (
                    <Input
                      value={row.value}
                      onChange={(e) => updateRow(row.id, { value: e.target.value })}
                      className="h-11 text-base"
                      type={row.value_type === "url" ? "url" : "text"}
                    />
                  )}

                  <AdvancedDetails>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FieldLabel
                          label="Field key"
                          helper="Internal ID — only change if you know what you're doing."
                        />
                        <Input
                          value={row.key}
                          onChange={(e) => updateRow(row.id, { key: e.target.value })}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel
                          label="Field type"
                          helper="Controls what kind of input is shown."
                        />
                        <select
                          value={row.value_type}
                          onChange={(e) => updateRow(row.id, { value_type: e.target.value })}
                          className="h-9 w-full text-xs rounded-md border border-input bg-background px-2"
                        >
                          <option value="text">Short text</option>
                          <option value="textarea">Long text (textarea)</option>
                          <option value="url">URL / link</option>
                          <option value="image">Image URL</option>
                        </select>
                      </div>
                    </div>
                  </AdvancedDetails>
                </div>
              ))}
            </EditorCard>
          ))
        )}
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {justSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Saved</span>
              </>
            ) : dirtyCount > 0 ? (
              <span>
                {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}.
              </span>
            ) : (
              <span>All changes saved.</span>
            )}
          </div>
          <Button
            onClick={saveAll}
            disabled={saving || dirtyCount === 0}
            className="h-10 px-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save changes
            {dirtyCount > 0 && (
              <Badge variant="secondary" className="ml-2">{dirtyCount}</Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
