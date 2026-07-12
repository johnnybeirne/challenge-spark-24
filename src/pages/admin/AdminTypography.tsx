import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Type } from "lucide-react";

type Row = {
  id: string;
  h1_size: number;
  h2_size: number;
  h3_size: number;
  body_size: number;
};

const H1_OPTIONS = [24, 28, 32, 36];
const H2_OPTIONS = [18, 20, 22, 24];
const H3_OPTIONS = [14, 15, 16, 17];
const BODY_OPTIONS = [13, 14, 15, 16];

const AdminTypography = () => {
  const [row, setRow] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("typography_settings" as any)
        .select("id,h1_size,h2_size,h3_size,body_size")
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error("Could not load typography settings");
        return;
      }
      if (data) setRow(data as any);
    })();
  }, []);

  const update = (patch: Partial<Row>) => {
    setRow((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const save = async () => {
    if (!row) return;
    setSaving(true);
    const { error } = await supabase
      .from("typography_settings" as any)
      .update({
        h1_size: row.h1_size,
        h2_size: row.h2_size,
        h3_size: row.h3_size,
        body_size: row.body_size,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    // Apply live to root so the change reflects without reload
    const rootEl = document.documentElement;
    rootEl.style.setProperty("--h1-size", `${row.h1_size}px`);
    rootEl.style.setProperty("--h2-size", `${row.h2_size}px`);
    rootEl.style.setProperty("--h3-size", `${row.h3_size}px`);
    rootEl.style.setProperty("--body-size", `${row.body_size}px`);
    toast.success("Typography saved");
  };

  if (!row) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const controls: Array<{
    key: keyof Row;
    label: string;
    hint: string;
    options: number[];
    weight: string;
    preview: string;
  }> = [
    {
      key: "h1_size",
      label: "Page title size",
      hint: "H1 — Page titles",
      options: H1_OPTIONS,
      weight: "700",
      preview: "Example",
    },
    {
      key: "h2_size",
      label: "Section heading size",
      hint: "H2 — Section headings",
      options: H2_OPTIONS,
      weight: "600",
      preview: "Example",
    },
    {
      key: "h3_size",
      label: "Card title size",
      hint: "H3 — Card and accordion titles",
      options: H3_OPTIONS,
      weight: "500",
      preview: "Example",
    },
    {
      key: "body_size",
      label: "Body text size",
      hint: "Body — Paragraph and normal text",
      options: BODY_OPTIONS,
      weight: "400",
      preview: "This is how your body text will look.",
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Type className="h-6 w-6 text-primary" />
          Typography
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control the size of headings and body text used across the app.
        </p>
      </div>

      {controls.map((c) => {
        const value = row[c.key] as number;
        return (
          <Card key={c.key}>
            <CardHeader>
              <CardTitle className="text-base">{c.hint}</CardTitle>
              <CardDescription>{c.label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div className="space-y-2">
                  <Label>{c.label}</Label>
                  <Select
                    value={String(value)}
                    onValueChange={(v) => update({ [c.key]: Number(v) } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {c.options.map((opt) => (
                        <SelectItem key={opt} value={String(opt)}>
                          {opt}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border bg-muted/30 p-4 min-h-[80px] flex items-center">
                  <span
                    style={{
                      fontSize: `${value}px`,
                      fontWeight: c.weight as any,
                      lineHeight: 1.3,
                    }}
                  >
                    {c.preview}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save typography"}
        </Button>
      </div>
    </div>
  );
};

export default AdminTypography;
