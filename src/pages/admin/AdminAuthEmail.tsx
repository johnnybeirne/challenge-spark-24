import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

const DEFAULTS: Record<string, string> = {
  subject: "Your sign-in code: {code}",
  body: `<p>Hi,</p>
<p>Here is your sign-in code:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;">{code}</p>
<p>Enter this code on the page you came from. It expires shortly.</p>
<p>If you didn't request this, you can ignore this email.</p>`,
};

const FIELDS: { key: string; label: string; textarea?: boolean; rows?: number }[] = [
  { key: "subject", label: "Email subject (use {code} for the 6-digit code)" },
  { key: "body", label: "Email body — HTML allowed (use {code} for the 6-digit code)", textarea: true, rows: 12 },
];

const AdminAuthEmail = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "auth")
      .eq("section", "auth_email")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load sign-in email copy");
          return;
        }
        const v: Record<string, string> = { ...DEFAULTS };
        for (const r of data ?? []) if ((r.value ?? "").trim()) v[r.key] = r.value;
        setValues(v);
      });
  }, []);

  const save = async () => {
    if (!values) return;
    setSaving(true);
    const rows = FIELDS.filter((f) => (values[f.key] ?? "").trim() !== "").map((f, i) => ({
      page: "auth",
      section: "auth_email",
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
    invalidatePage("auth");
    toast.success("Sign-in email copy saved");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MailCheck className="h-6 w-6 text-primary" />
          Sign-in code email
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          The email people receive with their 6-digit sign-in code. Use {"{code}"} where the code should appear.
        </p>
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
                <CardTitle className="text-lg">Email copy</CardTitle>
                <CardDescription>Saved changes apply to the next code email sent.</CardDescription>
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
                    rows={f.rows ?? 3}
                    className="font-mono text-xs"
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

export default AdminAuthEmail;
