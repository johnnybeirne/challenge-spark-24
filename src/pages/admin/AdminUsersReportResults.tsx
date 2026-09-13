import { useEffect, useState } from "react";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

const PAGE = "my_report";
const SECTION = "report";

const FIELDS: { key: string; label: string; textarea?: boolean; placeholder: string }[] = [
  { key: "heading", label: "Page heading", placeholder: "Your report" },
  {
    key: "intro",
    label: "Intro line (use {name} for their first name)",
    textarea: true,
    placeholder: "Here is what your answers point to, {name}.",
  },
  { key: "locked_heading", label: "Locked overlay heading", placeholder: "Your full report is waiting" },
  {
    key: "locked_body",
    label: "Locked overlay body",
    textarea: true,
    placeholder: "Join the 3-Day Challenge to read the whole thing and put it to work.",
  },
  { key: "cta_label", label: "CTA button label", placeholder: "Join the 3-Day Challenge" },
  { key: "joined_heading", label: "Heading after they join the challenge", placeholder: "Your full report" },
];

const AdminUsersReportResults = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", PAGE)
      .eq("section", SECTION)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load report page copy");
          return;
        }
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[r.key] = r.value;
        setValues(v);
      });
  }, []);

  const save = async () => {
    if (!values) return;
    setSaving(true);
    const rows = FIELDS.filter((f) => (values[f.key] ?? "").trim() !== "").map((f, i) => ({
      page: PAGE,
      section: SECTION,
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
    invalidatePage(PAGE);
    toast.success("Report page copy saved");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Users Report Results
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit the page report-only accounts land on at /my-report, both the locked and unlocked states.
          </p>
        </div>
        <PreviewButton href="/my-report" />
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
                <CardTitle className="text-lg">Page copy</CardTitle>
                <CardDescription>Headings, intro line, locked overlay, and the button label.</CardDescription>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.textarea ? (
                  <Textarea
                    rows={2}
                    value={values[f.key] ?? f.placeholder}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    value={values[f.key] ?? f.placeholder}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
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

export default AdminUsersReportResults;
