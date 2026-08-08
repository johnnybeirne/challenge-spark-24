import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Plus, Trash2, Search } from "lucide-react";

interface PromptRow {
  id: string;
  title: string;
  category: string;
  prompt: string;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
}

const AdminBuilderPrompts = () => {
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("builder_prompts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error("Could not load prompts");
    setRows((data as unknown as PromptRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = <K extends keyof PromptRow>(id: string, key: K, value: PromptRow[K]) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const save = async (row: PromptRow) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("builder_prompts")
      .update({
        title: row.title,
        category: row.category,
        prompt: row.prompt,
        notes: row.notes,
        sort_order: Number(row.sort_order) || 0,
        is_active: row.is_active,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) toast.error("Could not save. Try again.");
    else toast.success("Saved");
  };

  const addPrompt = async () => {
    const nextOrder = (rows[rows.length - 1]?.sort_order ?? 0) + 10;
    const { data, error } = await supabase
      .from("builder_prompts")
      .insert({
        title: "New prompt",
        category: "General",
        prompt: "",
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast.error("Could not add prompt");
      return;
    }
    setRows((prev) => [...prev, data as unknown as PromptRow]);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("builder_prompts").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Deleted");
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Prompt copied");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.prompt.toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Builder Prompts</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your library of reusable build instructions. Copy one, fill in the blanks, and send it.
          </p>
        </div>
        <Button onClick={addPrompt} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add prompt
        </Button>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search prompts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No prompts yet.</p>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={(v) => update(row.id, "is_active", v)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {row.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => copy(row.prompt)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => remove(row.id)}
                    aria-label="Delete prompt"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input
                    value={row.category}
                    onChange={(e) => update(row.id, "category", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Prompt</Label>
                <Textarea
                  rows={3}
                  value={row.prompt}
                  onChange={(e) => update(row.id, "prompt", e.target.value)}
                  placeholder="Put the standard unlock gate on <thing>, gate key <short-name>."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={row.notes ?? ""}
                  onChange={(e) => update(row.id, "notes", e.target.value)}
                  placeholder="What this prompt does, and when to use it."
                />
              </div>

              <div className="flex items-end justify-between gap-4">
                <div className="w-28 space-y-1.5">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={row.sort_order}
                    onChange={(e) => update(row.id, "sort_order", Number(e.target.value))}
                  />
                </div>
                <Button onClick={() => save(row)} disabled={savingId === row.id}>
                  {savingId === row.id ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminBuilderPrompts;
