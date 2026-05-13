import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Banknote, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Partner = { id: string; slug: string; display_name: string | null };
type Commission = {
  id: string;
  partner_id: string;
  amount_cents: number;
  status: "pending" | "approved" | "paid" | "revoked";
  level: number;
  created_at: string;
  payout_id: string | null;
  purchase_id: string | null;
};
type Payout = {
  id: string;
  partner_id: string;
  total_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
};

const eur = (cents: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);

const AdminPayouts = () => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [method, setMethod] = useState("stripe");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: pData }, { data: cData }, { data: poData }] = await Promise.all([
      supabase.from("partners").select("id,slug,display_name").order("created_at", { ascending: false }),
      supabase.from("commissions").select("*").in("status", ["pending", "approved"]).order("created_at", { ascending: false }),
      supabase.from("payouts").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setPartners((pData as Partner[]) ?? []);
    setCommissions((cData as Commission[]) ?? []);
    setPayouts((poData as Payout[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const partnerById = useMemo(
    () => Object.fromEntries(partners.map((p) => [p.id, p])),
    [partners]
  );

  // Group commissions by partner
  const grouped = useMemo(() => {
    const map = new Map<string, { partner: Partner | undefined; pending: Commission[]; approved: Commission[] }>();
    for (const c of commissions) {
      if (!map.has(c.partner_id)) {
        map.set(c.partner_id, { partner: partnerById[c.partner_id], pending: [], approved: [] });
      }
      const g = map.get(c.partner_id)!;
      if (c.status === "pending") g.pending.push(c);
      else if (c.status === "approved" && !c.payout_id) g.approved.push(c);
    }
    return Array.from(map.entries());
  }, [commissions, partnerById]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const approveOne = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_approve_commission", { p_commission_id: id });
    setBusy(null);
    if (error) return toast({ title: "Approve failed", description: error.message, variant: "destructive" });
    toast({ title: "Commission approved" });
    load();
  };

  const approveAllForPartner = async (partnerId: string) => {
    setBusy(`approve-${partnerId}`);
    const { error } = await supabase.rpc("admin_approve_partner_commissions", { p_partner_id: partnerId });
    setBusy(null);
    if (error) return toast({ title: "Bulk approve failed", description: error.message, variant: "destructive" });
    toast({ title: "All pending approved" });
    load();
  };

  const createPayout = async (partnerId: string, ids: string[]) => {
    if (ids.length === 0) return toast({ title: "Select at least one approved commission" });
    setBusy(`payout-${partnerId}`);
    const { error } = await supabase.rpc("admin_create_payout", {
      p_partner_id: partnerId,
      p_commission_ids: ids,
      p_method: method || null,
      p_reference: reference || null,
      p_notes: notes || null,
    });
    setBusy(null);
    if (error) return toast({ title: "Create payout failed", description: error.message, variant: "destructive" });
    toast({ title: "Payout created (pending)" });
    setSelected(new Set());
    setActivePartnerId(null);
    setReference(""); setNotes("");
    load();
  };

  const markPaid = async (payoutId: string) => {
    setBusy(payoutId);
    const ref = window.prompt("Payment reference (optional)") ?? null;
    const { error } = await supabase.rpc("admin_mark_payout_paid", {
      p_payout_id: payoutId,
      p_reference: ref || null,
    });
    setBusy(null);
    if (error) return toast({ title: "Mark paid failed", description: error.message, variant: "destructive" });
    toast({ title: "Payout marked paid" });
    load();
  };

  const voidPayout = async (payoutId: string) => {
    if (!confirm("Void this payout? Commissions will return to approved status.")) return;
    setBusy(payoutId);
    const { error } = await supabase.rpc("admin_void_payout", { p_payout_id: payoutId });
    setBusy(null);
    if (error) return toast({ title: "Void failed", description: error.message, variant: "destructive" });
    toast({ title: "Payout voided" });
    load();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payouts…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Payouts</h1>
          <p className="text-muted-foreground text-sm">
            Approve commissions, batch them into a payout, and mark as paid once sent.
          </p>
        </div>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">Commission queue</TabsTrigger>
          <TabsTrigger value="payouts">Payouts ({payouts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4 mt-4">
          {grouped.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground">
              No pending or approved commissions. They appear here automatically when a referred user purchases.
            </Card>
          )}
          {grouped.map(([partnerId, g]) => {
            const partner = g.partner;
            const totalApproved = g.approved.reduce((s, c) => s + c.amount_cents, 0);
            const selectedTotal = g.approved
              .filter((c) => selected.has(c.id))
              .reduce((s, c) => s + c.amount_cents, 0);
            const isActive = activePartnerId === partnerId;
            return (
              <Card key={partnerId} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold">
                      {partner?.display_name || partner?.slug || partnerId.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {g.pending.length} pending · {g.approved.length} approved · {eur(totalApproved)} payable
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {g.pending.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === `approve-${partnerId}`}
                        onClick={() => approveAllForPartner(partnerId)}
                      >
                        Approve all pending
                      </Button>
                    )}
                    {g.approved.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActivePartnerId(isActive ? null : partnerId);
                          if (!isActive) setSelected(new Set(g.approved.map((c) => c.id)));
                          else setSelected(new Set());
                        }}
                      >
                        {isActive ? "Cancel" : "Create payout"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Commission rows */}
                <div className="space-y-1 text-sm">
                  {[...g.approved, ...g.pending].map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 py-1.5 border-t border-border/50 first:border-0">
                      <div className="flex items-center gap-2">
                        {isActive && c.status === "approved" && (
                          <Checkbox
                            checked={selected.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        )}
                        <Badge variant={c.status === "approved" ? "default" : "secondary"}>
                          L{c.level} · {c.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{eur(c.amount_cents)}</span>
                        {c.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === c.id}
                            onClick={() => approveOne(c.id)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isActive && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input placeholder="Method (stripe, sepa, paypal…)" value={method} onChange={(e) => setMethod(e.target.value)} />
                      <Input placeholder="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
                      <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        Selected: <span className="font-semibold">{eur(selectedTotal)}</span> ({selected.size})
                      </div>
                      <Button
                        size="sm"
                        disabled={busy === `payout-${partnerId}` || selected.size === 0}
                        onClick={() => createPayout(partnerId, Array.from(selected))}
                      >
                        Create pending payout
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-3 mt-4">
          {payouts.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground">No payouts yet.</Card>
          )}
          {payouts.map((p) => {
            const partner = partnerById[p.partner_id];
            return (
              <Card key={p.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{partner?.display_name || partner?.slug || p.partner_id.slice(0, 8)}</span>
                    <Badge variant={p.status === "paid" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} · {p.method ?? "—"} · ref {p.reference ?? "—"}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{eur(p.total_cents)}</span>
                  {p.status === "pending" && (
                    <>
                      <Button size="sm" disabled={busy === p.id} onClick={() => markPaid(p.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark paid
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => voidPayout(p.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Void
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPayouts;
