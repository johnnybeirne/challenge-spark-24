import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, ExternalLink } from "lucide-react";
import { invalidatePage, type SiteContentRow } from "@/hooks/useSiteContent";
import { Link } from "react-router-dom";

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

const AdminContent = () => {
  const [activePage, setActivePage] = useState<string>(PAGES[0].id);
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!confirm(`Delete "${row.section}.${row.key}"?`)) return;
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
    if (ok) toast.success(`Saved ${ok} change${ok === 1 ? "" : "s"}`);
    invalidatePage(activePage);
    load(activePage);
  };

  const dirtyCount = rows.filter((r) => r._dirty).length;
  const currentPage = PAGES.find((p) => p.id === activePage)!;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Page picker */}
      <aside className="lg:w-64 shrink-0">
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
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{currentPage.label}</h1>
            <p className="text-sm text-muted-foreground">{currentPage.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentPage.previewUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link to={currentPage.previewUrl} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-1" /> Preview
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-1" /> New section
            </Button>
            <Button size="sm" onClick={saveAll} disabled={saving || dirtyCount === 0}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save {dirtyCount > 0 && <Badge variant="secondary" className="ml-2">{dirtyCount}</Badge>}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No content yet for this page. Click "New section" to add one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([section, items]) => (
              <Card key={section}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base capitalize">{section}</CardTitle>
                      <CardDescription>{items.length} field{items.length === 1 ? "" : "s"}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => addRow(section)}>
                      <Plus className="h-4 w-4 mr-1" /> Add field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((row) => (
                    <div
                      key={row.id}
                      className={`grid gap-2 sm:grid-cols-[1fr_2fr_auto] items-start p-3 rounded-md border ${
                        row._dirty ? "border-primary/50 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={row.label ?? ""}
                          onChange={(e) => updateRow(row.id, { label: e.target.value })}
                          placeholder="Friendly label"
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <Input
                            value={row.key}
                            onChange={(e) => updateRow(row.id, { key: e.target.value })}
                            placeholder="key"
                            className="h-7 text-xs font-mono"
                          />
                          <select
                            value={row.value_type}
                            onChange={(e) => updateRow(row.id, { value_type: e.target.value })}
                            className="h-7 text-xs rounded border border-input bg-background px-1"
                          >
                            <option value="text">text</option>
                            <option value="textarea">textarea</option>
                            <option value="url">url</option>
                            <option value="image">image</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Value</Label>
                        {row.value_type === "textarea" ? (
                          <Textarea
                            value={row.value}
                            onChange={(e) => updateRow(row.id, { value: e.target.value })}
                            rows={3}
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            value={row.value}
                            onChange={(e) => updateRow(row.id, { value: e.target.value })}
                            className="text-sm"
                          />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row)}
                        className="text-muted-foreground hover:text-destructive mt-5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;
