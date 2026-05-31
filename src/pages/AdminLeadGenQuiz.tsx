import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ListChecks } from "lucide-react";

type Row = {
  id: string;
  position: number;
  text: string;
  option_yes_label: string;
  option_no_label: string;
};

const AdminLeadGenQuiz = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id,position,text,option_yes_label,option_no_label")
      .order("position", { ascending: true });
    if (error) {
      toast.error("Could not load quiz questions");
      return;
    }
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev));
  };

  const save = async (row: Row) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("quiz_questions")
      .update({
        text: row.text.trim(),
        option_yes_label: row.option_yes_label.trim() || "Yes",
        option_no_label: row.option_no_label.trim() || "No",
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success("Saved");
  };

  if (!rows) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          Lead Gen Quiz Questions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the wording of each quiz question and its Yes / No labels. Question order and
          scoring stay fixed.
        </p>
      </div>

      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Question {row.position}</CardTitle>
                <CardDescription>ID: {row.id}</CardDescription>
              </div>
              <Button onClick={() => save(row)} disabled={savingId === row.id}>
                {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`text-${row.id}`}>Question text</Label>
              <Textarea
                id={`text-${row.id}`}
                value={row.text}
                rows={2}
                onChange={(e) => updateRow(row.id, { text: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`yes-${row.id}`}>"Yes" button label</Label>
                <Input
                  id={`yes-${row.id}`}
                  value={row.option_yes_label}
                  onChange={(e) => updateRow(row.id, { option_yes_label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`no-${row.id}`}>"No" button label</Label>
                <Input
                  id={`no-${row.id}`}
                  value={row.option_no_label}
                  onChange={(e) => updateRow(row.id, { option_no_label: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminLeadGenQuiz;
