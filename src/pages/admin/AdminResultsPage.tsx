import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, LayoutList, ChevronRight } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

const LINKED_EDITORS: { title: string; description: string; url: string }[] = [
  {
    title: "Report opt-in card",
    description: "The get your report by email card and its code bar.",
    url: "/owner-console/results-optin-card",
  },
  {
    title: "Lead gen quiz responses",
    description: "Score bands, titles and the written findings shown on the page.",
    url: "/owner-console/diagnostic-responses",
  },
  {
    title: "Results advisor prompts",
    description: "The suggested questions offered by the advisor.",
    url: "/owner-console/results-advisor-prompts",
  },
  {
    title: "Section blocks (Quiz LP Editor)",
    description: "Eyebrow, section title and body blocks for the Results page.",
    url: "/owner-console/content",
  },
];

const SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const FIELDS = [
  { key: "heading", label: "Heading" },
  { key: "heading_size", label: "Heading size" },
  { key: "subheading", label: "Subheading" },
  { key: "subheading_size", label: "Subheading size" },
];

const AdminResultsPage = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "results")
      .eq("section", "score_header")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load the score header copy");
          return;
        }
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[r.key] = r.value;
        setValues(v);
      });
  }, []);

  const set = (key: string, value: string) => setValues((prev) => ({ ...(prev ?? {}), [key]: value }));

  const save = async () => {
    if (!values) return;
    setSaving(true);
    const rows = FIELDS.filter((f) => (values[f.key] ?? "").trim() !== "").map((f, i) => ({
      page: "results",
      section: "score_header",
      key: f.key,
      value: values[f.key],
      value_type: "text",
      label: f.label,
      sort_order: i,
    }));
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "page,section,key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    invalidatePage("results");
    toast.success("Score header saved");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" />
            Results Page Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            One place to reach everything on the results page, plus the score heading at the top.
          </p>
        </div>
        <PreviewButton href="/results/high" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parts of this page</CardTitle>
          <CardDescription>Each one opens the screen that owns that copy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {LINKED_EDITORS.map((e) => (
            <Link
              key={e.url}
              to={e.url}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{e.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {!values ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Score header</CardTitle>
                <CardDescription>The heading and line of text above the score dial.</CardDescription>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Heading</Label>
              <Input
                value={values.heading ?? ""}
                placeholder="Your Lead Generation Score"
                onChange={(e) => set("heading", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Heading size</Label>
              <Select value={values.heading_size ?? "small"} onValueChange={(v) => set("heading_size", v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subheading</Label>
              <Textarea
                rows={2}
                value={values.subheading ?? ""}
                placeholder="Get a clear set of findings, then a recommended strategy."
                onChange={(e) => set("subheading", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subheading size</Label>
              <Select value={values.subheading_size ?? "medium"} onValueChange={(v) => set("subheading_size", v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminResultsPage;
