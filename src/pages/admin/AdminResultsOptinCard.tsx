import { useEffect, useState } from "react";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

const OPTIN_FIELDS: { key: string; label: string; textarea?: boolean }[] = [
  { key: "title", label: "Card title" },
  { key: "body", label: "Card body", textarea: true },
  { key: "name_label", label: "Name field label" },
  { key: "name_placeholder", label: "Name field placeholder" },
  { key: "email_label", label: "Email field label" },
  { key: "email_placeholder", label: "Email field placeholder" },
  { key: "button_label", label: "Button label" },
  { key: "sending_label", label: "Button label while sending" },
  { key: "success_title", label: "Success title" },
  { key: "success_body", label: "Success body (use {email} for their email)", textarea: true },
];

const AdminResultsOptinCard = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("section,key,value")
      .eq("page", "results")
      .eq("section", "report_optin")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load report card copy");
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
    const rows = OPTIN_FIELDS.filter((f) => (values[f.key] ?? "").trim() !== "").map((f, i) => ({
      page: "results",
      section: "report_optin",
      key: f.key,
      value: values[f.key],
      value_type: "text",
      label: f.label,
      sort_order: i,
    }));
    const { error } = await supabase
      .from("site_content")
      .upsert(rows, { onConflict: "page,section,key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    invalidatePage("results");
    toast.success("Report card copy saved");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Results opt-in card
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit the "get your report by email" card shown under the main button on the Results page.
          </p>
        </div>
        <PreviewButton href="/results/high" />
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
                <CardTitle className="text-lg">Card copy</CardTitle>
                <CardDescription>Every piece of text on the card, including the success message.</CardDescription>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {OPTIN_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.textarea ? (
                  <Textarea
                    rows={2}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    value={values[f.key] ?? ""}
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

export default AdminResultsOptinCard;
