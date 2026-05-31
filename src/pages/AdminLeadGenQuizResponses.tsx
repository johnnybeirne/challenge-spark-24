import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, MessageCircle } from "lucide-react";

type Row = {
  id: string;
  tier: string;
  min_percent: number;
  max_percent: number;
  title: string;
  messages: string[];
};

const TIER_LABELS: Record<string, string> = {
  low: "0% – 50%",
  mid: "51% – 75%",
  high: "76% – 100%",
};

const TIER_ORDER = ["low", "mid", "high"];

const AdminLeadGenQuizResponses = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("diagnostic_responses")
      .select("id,tier,min_percent,max_percent,title,messages");
    if (error) {
      toast.error("Could not load responses");
      return;
    }
    const normalised: Row[] = (data ?? []).map((r: any) => ({
      id: r.id,
      tier: r.tier,
      min_percent: r.min_percent,
      max_percent: r.max_percent,
      title: r.title,
      messages: Array.isArray(r.messages) ? r.messages.filter((m: any) => typeof m === "string") : [],
    }));
    normalised.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
    setRows(normalised);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev));
  };

  const updateMessage = (id: string, index: number, value: string) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.id === id ? { ...r, messages: r.messages.map((m, i) => (i === index ? value : m)) } : r,
          )
        : prev,
    );
  };

  const addMessage = (id: string) => {
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, messages: [...r.messages, ""] } : r)) : prev,
    );
  };

  const removeMessage = (id: string, index: number) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.id === id ? { ...r, messages: r.messages.filter((_, i) => i !== index) } : r,
          )
        : prev,
    );
  };

  const save = async (row: Row) => {
    setSavingId(row.id);
    const cleanedMessages = row.messages.map((m) => m.trim()).filter(Boolean);
    const { error } = await supabase
      .from("diagnostic_responses")
      .update({
        title: row.title.trim(),
        messages: cleanedMessages,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success("Saved");
    updateRow(row.id, { messages: cleanedMessages });
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
          <MessageCircle className="h-6 w-6 text-primary" />
          Lead Gen Quiz Responses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the chat shown on the Results page. Each tier uses one or more chat bubbles. The first bubble is the title.
        </p>
      </div>

      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{TIER_LABELS[row.tier] ?? row.tier}</CardTitle>
                <CardDescription>
                  Shown when score is between {row.min_percent}% and {row.max_percent}%.
                </CardDescription>
              </div>
              <Button onClick={() => save(row)} disabled={savingId === row.id}>
                {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`title-${row.id}`}>Title (first chat bubble)</Label>
              <Input
                id={`title-${row.id}`}
                value={row.title}
                onChange={(e) => updateRow(row.id, { title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Chat messages</Label>
              <p className="text-xs text-muted-foreground">
                Each line below appears as its own chat bubble, typed out one after another.
              </p>
              <div className="space-y-2">
                {row.messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Textarea
                      value={msg}
                      onChange={(e) => updateMessage(row.id, i, e.target.value)}
                      rows={2}
                      className="flex-1"
                      placeholder={`Message ${i + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMessage(row.id, i)}
                      aria-label="Remove message"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => addMessage(row.id)}>
                <Plus className="h-4 w-4 mr-1" /> Add message
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminLeadGenQuizResponses;
