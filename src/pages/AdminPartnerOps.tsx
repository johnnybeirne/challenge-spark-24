import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shuffle, Ban, GitMerge, Plus, Minus, RefreshCw } from "lucide-react";

type Partner = { id: string; slug: string; display_name: string | null; status: string };

const AdminPartnerOps = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [busy, setBusy] = useState(false);

  // Reassign
  const [reUser, setReUser] = useState("");
  const [reSlug, setReSlug] = useState("");

  // Revoke
  const [revokeId, setRevokeId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  // Merge
  const [mergeKeep, setMergeKeep] = useState("");
  const [mergeRemove, setMergeRemove] = useState("");

  // Score
  const [scoreSlug, setScoreSlug] = useState("");
  const [scoreDelta, setScoreDelta] = useState("");

  const loadPartners = async () => {
    const { data } = await supabase
      .from("partners")
      .select("id, slug, display_name, status")
      .order("created_at", { ascending: false });
    setPartners((data as Partner[]) || []);
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const slugToId = (slug: string) => partners.find((p) => p.slug === slug.trim())?.id;

  const run = async <T,>(label: string, fn: () => Promise<T>) => {
    setBusy(true);
    try {
      await fn();
      toast.success(label);
      await loadPartners();
    } catch (e: any) {
      toast.error(e?.message || `${label} failed`);
    } finally {
      setBusy(false);
    }
  };

  const doReassign = () =>
    run("Attribution reassigned", async () => {
      if (!reUser.trim() || !reSlug.trim()) throw new Error("User ID and partner slug required");
      const { error } = await supabase.rpc("admin_reassign_attribution", {
        p_user_id: reUser.trim(),
        p_new_partner_slug: reSlug.trim(),
      });
      if (error) throw error;
      setReUser("");
      setReSlug("");
    });

  const doRevoke = () =>
    run("Commission revoked", async () => {
      if (!revokeId.trim()) throw new Error("Commission ID required");
      const { error } = await supabase.rpc("admin_revoke_commission", {
        p_commission_id: revokeId.trim(),
        p_reason: revokeReason.trim() || null,
      });
      if (error) throw error;
      setRevokeId("");
      setRevokeReason("");
    });

  const doMerge = () =>
    run("Partners merged", async () => {
      const keepId = slugToId(mergeKeep);
      const removeId = slugToId(mergeRemove);
      if (!keepId || !removeId) throw new Error("Both slugs must match an existing partner");
      if (keepId === removeId) throw new Error("Cannot merge a partner into itself");
      if (!confirm(`Merge "${mergeRemove}" into "${mergeKeep}"? This is irreversible.`)) return;
      const { error } = await supabase.rpc("admin_merge_partners", {
        p_keep: keepId,
        p_remove: removeId,
      });
      if (error) throw error;
      setMergeKeep("");
      setMergeRemove("");
    });

  const doScore = (sign: 1 | -1) =>
    run("Score adjusted", async () => {
      const id = slugToId(scoreSlug);
      if (!id) throw new Error("Slug must match an existing partner");
      const n = parseInt(scoreDelta, 10);
      if (isNaN(n) || n <= 0) throw new Error("Enter a positive number");
      const { error } = await supabase.rpc("admin_adjust_partner_score", {
        p_partner_id: id,
        p_delta: sign * n,
      });
      if (error) throw error;
      setScoreDelta("");
    });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin tools for fixing attribution, commissions, partner records, and leaderboard scores.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPartners} className="gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shuffle className="h-4 w-4 text-blue-500" /> Reassign attribution
          </CardTitle>
          <CardDescription>
            Move a signup to a different partner. Overwrites any existing attribution for the user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">User ID (uuid)</Label>
              <Input value={reUser} onChange={(e) => setReUser(e.target.value)} placeholder="00000000-..." className="font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs">New partner slug</Label>
              <Input value={reSlug} onChange={(e) => setReSlug(e.target.value)} placeholder="jane-doe" />
            </div>
          </div>
          <Button onClick={doReassign} disabled={busy} size="sm">Reassign</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ban className="h-4 w-4 text-red-500" /> Revoke commission
          </CardTitle>
          <CardDescription>
            Mark a commission as revoked. Reason is appended to its notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Commission ID (uuid)</Label>
            <Input value={revokeId} onChange={(e) => setRevokeId(e.target.value)} placeholder="00000000-..." className="font-mono text-xs" />
          </div>
          <div>
            <Label className="text-xs">Reason (optional)</Label>
            <Textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={2} placeholder="Refunded by Stripe…" />
          </div>
          <Button onClick={doRevoke} disabled={busy} size="sm" variant="destructive">Revoke</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitMerge className="h-4 w-4 text-purple-500" /> Merge partners
          </CardTitle>
          <CardDescription>
            Move all attributions, commissions, payouts, and invites from one partner into another. The removed partner is suspended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Keep slug</Label>
              <Input value={mergeKeep} onChange={(e) => setMergeKeep(e.target.value)} placeholder="primary-account" />
            </div>
            <div>
              <Label className="text-xs">Remove slug</Label>
              <Input value={mergeRemove} onChange={(e) => setMergeRemove(e.target.value)} placeholder="duplicate-account" />
            </div>
          </div>
          <Button onClick={doMerge} disabled={busy} size="sm" variant="destructive">Merge</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-green-500" /> Adjust leaderboard score
          </CardTitle>
          <CardDescription>
            Add to or subtract from a partner's manual score adjustment (added to attributed signups on the leaderboard).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Partner slug</Label>
              <Input value={scoreSlug} onChange={(e) => setScoreSlug(e.target.value)} placeholder="jane-doe" />
            </div>
            <div>
              <Label className="text-xs">Amount</Label>
              <Input value={scoreDelta} onChange={(e) => setScoreDelta(e.target.value)} type="number" min="1" placeholder="5" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => doScore(1)} disabled={busy} size="sm" className="gap-1">
              <Plus className="h-3 w-3" /> Add
            </Button>
            <Button onClick={() => doScore(-1)} disabled={busy} size="sm" variant="outline" className="gap-1">
              <Minus className="h-3 w-3" /> Subtract
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active partners ({partners.length})</CardTitle>
          <CardDescription>Slug reference for the actions above.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2 max-h-96 overflow-auto">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2 text-xs">
                <div>
                  <div className="font-mono">{p.slug}</div>
                  <div className="text-muted-foreground">{p.display_name || "—"}</div>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${p.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                  {p.status}
                </span>
              </div>
            ))}
            {partners.length === 0 && <p className="text-sm text-muted-foreground">No partners yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPartnerOps;
