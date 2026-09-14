import { useEffect, useState } from "react";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

// The emailed report page (/r/:token) copy.
const REPORT_PAGE_FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "tease_heading", label: "Teaser heading", placeholder: "What the 3-Day Challenge does about this" },
  {
    key: "tease_day1",
    label: "Teaser line 1",
    placeholder: "Step one: shape a promise your audience recognises, so the right people lean in.",
    multiline: true,
  },
  {
    key: "tease_day2",
    label: "Teaser line 2",
    placeholder: "Step two: turn that promise into a simple quiz that brings you leads while you sleep.",
    multiline: true,
  },
  {
    key: "tease_day3",
    label: "Teaser line 3",
    placeholder: "Step three: put a follow-up sequence behind it so interest turns into paying clients.",
    multiline: true,
  },
  { key: "cta_heading", label: "Closing heading", placeholder: "Ready to fix it for good?" },
  {
    key: "cta_body",
    label: "Closing body",
    placeholder: "Join the free 3-day challenge and build the system your report points to, step by step.",
    multiline: true,
  },
  { key: "cta_button", label: "Button label", placeholder: "Join the 3-Day Challenge" },
  { key: "error_heading", label: "Report not available, heading", placeholder: "Report not available" },
  {
    key: "error_body",
    label: "Report not available, body",
    placeholder: "We could not find a report for this link. It may be incomplete or no longer valid.",
    multiline: true,
  },
];

const AdminReportPage = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "results")
      .eq("section", "report_page")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load the report page copy");
          return;
        }
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[r.key] = r.value;
        setValues(v);
      });
  }, []);

  const set = (key: string, value: string) => setValues((prev) => ({ ...(prev ?? {}), [key]: value }));

  const save = async () => {
    const rows = REPORT_PAGE_FIELDS.map((f, i) => ({
      page: "results",
      section: "report_page",
      key: f.key,
      value: values?.[f.key] ?? "",
      value_type: "text",
      label: f.label,
      sort_order: i,
    })).filter((r) => (r.value ?? "").trim() !== "");

    if (rows.length === 0) {
      toast.error("Nothing to save yet");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "page,section,key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    invalidatePage("results");
    toast.success("Saved");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Results Page Editor - Non-signup
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The page a lead opens from the link we email them.
          </p>
        </div>
        <PreviewButton href="/r/sample" />
      </div>

      {!values ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Page wording</CardTitle>
                <CardDescription>
                  Teaser, join button and the message shown when a link no longer works.
                </CardDescription>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {REPORT_PAGE_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.multiline ? (
                  <Textarea
                    rows={2}
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminReportPage;
