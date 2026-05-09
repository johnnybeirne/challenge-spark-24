import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Tag } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  label: string;
  original_price: number;
  final_price: number;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

const emptyDraft = {
  code: "",
  label: "",
  original_price: 497,
  final_price: 0,
  max_redemptions: "" as string,
  expires_at: "" as string,
  notes: "",
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load coupons", description: error.message, variant: "destructive" });
    } else {
      setCoupons(data as Coupon[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!draft.code.trim()) {
      toast({ title: "Code is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: draft.code.trim().toUpperCase(),
      label: draft.label.trim(),
      original_price: Number(draft.original_price) || 0,
      final_price: Number(draft.final_price) || 0,
      max_redemptions: draft.max_redemptions ? Number(draft.max_redemptions) : null,
      expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : null,
      notes: draft.notes.trim() || null,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not create coupon", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Coupon created" });
    setDraft(emptyDraft);
    load();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Coupon Codes</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Create discount codes that customers can apply on the Premium checkout. Track redemptions and toggle codes on or off here.
      </p>

      <Card className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New coupon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Code</Label>
            <Input
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              placeholder="LAUNCH50"
              className="font-mono uppercase"
            />
          </div>
          <div>
            <Label>Label</Label>
            <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="Launch promo" />
          </div>
          <div>
            <Label>Original price ($)</Label>
            <Input type="number" value={draft.original_price} onChange={(e) => setDraft({ ...draft, original_price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Final price ($)</Label>
            <Input type="number" value={draft.final_price} onChange={(e) => setDraft({ ...draft, final_price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Max redemptions (blank = unlimited)</Label>
            <Input type="number" value={draft.max_redemptions} onChange={(e) => setDraft({ ...draft, max_redemptions: e.target.value })} />
          </div>
          <div>
            <Label>Expires at (optional)</Label>
            <Input type="datetime-local" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Notes</Label>
            <Input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Internal note" />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "Create coupon"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b text-sm font-bold uppercase tracking-wide text-muted-foreground">
          All coupons {loading ? "(loading…)" : `(${coupons.length})`}
        </div>
        <div className="divide-y">
          {coupons.length === 0 && !loading && (
            <div className="p-6 text-sm text-muted-foreground text-center">No coupons yet.</div>
          )}
          {coupons.map((c) => (
            <div key={c.id} className="p-4 flex flex-wrap items-center gap-4">
              <div className="min-w-[160px]">
                <div className="font-mono font-bold">{c.code}</div>
                <div className="text-xs text-muted-foreground">{c.label || "—"}</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground line-through">${c.original_price}</span>{" "}
                <span className="font-bold">${c.final_price}</span>
              </div>
              <div className="text-sm">
                <Badge variant="secondary">
                  {c.redemption_count} {c.max_redemptions != null ? `/ ${c.max_redemptions}` : ""} used
                </Badge>
              </div>
              {c.expires_at && (
                <div className="text-xs text-muted-foreground">
                  Expires {new Date(c.expires_at).toLocaleString()}
                </div>
              )}
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  <span className="text-xs">{c.is_active ? "Active" : "Inactive"}</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminCoupons;
