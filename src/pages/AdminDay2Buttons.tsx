import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import {
  DAY2_EXAMPLE_VALUES,
  DAY2_TAG_KEYS,
  Day2ButtonLabel,
  SCREEN_LABELS,
  defaultDay2Buttons,
  fetchDay2ButtonsRemote,
  loadDay2Buttons,
  renderDay2Preview,
  saveDay2Buttons,
  saveDay2ButtonsRemote,
} from "@/lib/day2ButtonLabels";

const AdminDay2Buttons = () => {
  const [rows, setRows] = useState<Day2ButtonLabel[]>(() => loadDay2Buttons());
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    trackEvent("admin_training_viewed", { surface: "day2_button_editor" });
    let cancelled = false;
    (async () => {
      const remote = await fetchDay2ButtonsRemote();
      if (cancelled) return;
      if (remote) {
        setRows(remote);
        saveDay2Buttons(remote);
      }
      setHydrating(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const updateRow = (id: string, label: string) =>
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, label } : r));
      saveDay2Buttons(next);
      return next;
    });

  const persistRemote = async (next: Day2ButtonLabel[], msg: string) => {
    setSaving(true);
    const { error } = await saveDay2ButtonsRemote(next);
    setSaving(false);
    if (error) {
      toast.error("Could not sync to the cloud. Local edits still saved.");
      return;
    }
    toast.success(msg);
  };

  const handleSave = async () => {
    await persistRemote(rows, "Day 2 button labels synced to the cloud");
    trackEvent("admin_training_updated", { surface: "day2_button_editor" });
  };

  const handleResetAll = async () => {
    setRows(defaultDay2Buttons);
    await persistRemote(defaultDay2Buttons, "Reverted to defaults and synced.");
  };

  const handleResetOne = (id: string) => {
    const def = defaultDay2Buttons.find((r) => r.id === id);
    if (!def) return;
    updateRow(id, def.label);
  };

  const grouped = useMemo(() => {
    const byScreen = new Map<string, Day2ButtonLabel[]>();
    rows.forEach((r) => {
      if (!byScreen.has(r.screen)) byScreen.set(r.screen, []);
      byScreen.get(r.screen)!.push(r);
    });
    byScreen.forEach((list) => list.sort((a, b) => a.sort_order - b.sort_order));
    return Array.from(byScreen.entries());
  }, [rows]);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Day 2 Button Labels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit the predefined prompt button labels shown on every Day 2 screen. Use bracket tags to
            inject the builder's own Day 1 data. The live preview substitutes example values so you can
            see exactly how each label appears.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleResetAll} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset all
          </Button>
          <Button onClick={handleSave} disabled={saving || hydrating} className="gap-2">
            <Save className="h-4 w-4" /> {hydrating ? "Loading…" : saving ? "Syncing…" : "Save"}
          </Button>
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Available bracket tags
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY2_TAG_KEYS.map((key) => (
              <Badge key={key} variant="secondary" className="font-mono text-xs">
                [{key}] → {DAY2_EXAMPLE_VALUES[key]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {grouped.map(([screen, list]) => (
          <section key={screen} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {SCREEN_LABELS[screen] || screen}
            </h2>
            <div className="space-y-4">
              {list.map((row) => (
                <ButtonEditorCard
                  key={row.id}
                  row={row}
                  onChange={(label) => updateRow(row.id, label)}
                  onReset={() => handleResetOne(row.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Syncing…" : "Save all changes"}
        </Button>
      </div>
    </div>
  );
};

const ButtonEditorCard = ({
  row,
  onChange,
  onReset,
}: {
  row: Day2ButtonLabel;
  onChange: (label: string) => void;
  onReset: () => void;
}) => {
  const preview = useMemo(() => renderDay2Preview(row.label), [row.label]);
  const id = `day2-btn-${row.id}`;
  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={id} className="text-sm font-semibold font-mono text-muted-foreground">
            {row.id}
          </Label>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 h-7">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Label template
          </Label>
          <Input
            id={id}
            value={row.label}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Why a quiz works for [audience]"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm md:text-base text-foreground/90">
            {preview.trim().length > 0 ? preview : (
              <span className="text-muted-foreground italic">Preview appears here as you type.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDay2Buttons;
