import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UnlockGateConfig } from "@/hooks/useUnlockGate";

type GateRow = UnlockGateConfig & { id: string };

const AdminUnlockGates = () => {
  const [rows, setRows] = useState<GateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("unlock_gates")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) toast.error("Could not load unlock gates");
      setRows((data as any as GateRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const update = <K extends keyof GateRow>(id: string, key: K, value: GateRow[K]) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const save = async (row: GateRow) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("unlock_gates")
      .update({
        label: row.label,
        enabled: row.enabled,
        title: row.title,
        body: row.body,
        teaser_lines: Number(row.teaser_lines) || 0,
        price_cents: Math.round(Number(row.price_cents) || 0),
        invites_required: Number(row.invites_required) || 0,
        show_buy: row.show_buy,
        show_invite: row.show_invite,
        buy_label: row.buy_label,
        invite_label: row.invite_label,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) toast.error("Could not save. Try again.");
    else toast.success("Saved");
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-foreground">Unlocks</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every locked area in the app. Set the price, how many invites unlock it free, and
        the wording participants see.
      </p>

      {rows.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No unlock gates yet.</p>
      )}

      <div className="mt-6 space-y-6">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {row.label || row.key}
                  </p>
                  <p className="text-xs text-muted-foreground">Gate key: {row.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`enabled-${row.id}`} className="text-xs">
                    Locked
                  </Label>
                  <Switch
                    id={`enabled-${row.id}`}
                    checked={row.enabled}
                    onCheckedChange={(v) => update(row.id, "enabled", v)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Heading</Label>
                  <Input
                    value={row.title}
                    onChange={(e) => update(row.id, "title", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Admin label</Label>
                  <Input
                    value={row.label}
                    onChange={(e) => update(row.id, "label", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Body copy</Label>
                <Textarea
                  rows={3}
                  value={row.body}
                  onChange={(e) => update(row.id, "body", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Price (cents)</Label>
                  <Input
                    type="number"
                    value={row.price_cents}
                    onChange={(e) => update(row.id, "price_cents", Number(e.target.value) as any)}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Shown as ${(Number(row.price_cents) / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Invites required</Label>
                  <Input
                    type="number"
                    value={row.invites_required}
                    onChange={(e) =>
                      update(row.id, "invites_required", Number(e.target.value) as any)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Teaser lines</Label>
                  <Input
                    type="number"
                    value={row.teaser_lines}
                    onChange={(e) => update(row.id, "teaser_lines", Number(e.target.value) as any)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Buy button label</Label>
                  <Input
                    value={row.buy_label}
                    onChange={(e) => update(row.id, "buy_label", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Invite path label</Label>
                  <Input
                    value={row.invite_label}
                    onChange={(e) => update(row.id, "invite_label", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`buy-${row.id}`}
                    checked={row.show_buy}
                    onCheckedChange={(v) => update(row.id, "show_buy", v)}
                  />
                  <Label htmlFor={`buy-${row.id}`} className="text-xs">
                    Show buy path
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`invite-${row.id}`}
                    checked={row.show_invite}
                    onCheckedChange={(v) => update(row.id, "show_invite", v)}
                  />
                  <Label htmlFor={`invite-${row.id}`} className="text-xs">
                    Show invite path
                  </Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => save(row)} disabled={savingId === row.id}>
                  {savingId === row.id ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminUnlockGates;
