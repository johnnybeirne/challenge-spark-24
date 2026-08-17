import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Plus, Ban, RefreshCw } from "lucide-react";

type GuestPass = {
  id: string;
  token: string;
  label: string;
  note: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
};

const makeToken = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const baseUrl = () =>
  typeof window !== "undefined" ? window.location.origin : "https://leadtree.johnnybeirne.com";

const AdminGuestPasses = () => {
  const [passes, setPasses] = useState<GuestPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [days, setDays] = useState("7");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guest_passes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load guest passes");
    setPasses((data ?? []) as GuestPass[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!label.trim()) {
      toast.error("Give the pass a name so you know who it is for");
      return;
    }
    setCreating(true);
    const uses = Math.max(0, Number(maxUses) || 0);
    const dayCount = Number(days);
    const expires =
      dayCount > 0 ? new Date(Date.now() + dayCount * 86400000).toISOString() : null;

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("guest_passes").insert({
      token: makeToken(),
      label: label.trim(),
      max_uses: uses,
      expires_at: expires,
      created_by: userData?.user?.id ?? null,
    });
    setCreating(false);
    if (error) {
      toast.error("Could not create the pass");
      return;
    }
    setLabel("");
    toast.success("Private pass created");
    void load();
  };

  const revoke = async (id: string, revoked: boolean) => {
    const { error } = await supabase.from("guest_passes").update({ revoked }).eq("id", id);
    if (error) {
      toast.error("Could not update the pass");
      return;
    }
    void load();
  };

  const copyLink = async (token: string) => {
    const url = `${baseUrl()}/pass/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Private link copied");
    } catch {
      toast.error("Copy failed, select the link manually");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Private guest passes</h1>
        <p className="text-muted-foreground">
          Create a secret link so one person can come in and look around. The link is unguessable,
          can expire, and can be turned off at any point. It is separate from the public join page.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="pass-label">Who is it for</Label>
            <Input
              id="pass-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Sarah, product feedback"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass-uses">Number of uses (0 for unlimited)</Label>
            <Input
              id="pass-uses"
              type="number"
              min={0}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass-days">Valid for days (0 for no expiry)</Label>
            <Input
              id="pass-days"
              type="number"
              min={0}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={create} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          Create private link
        </Button>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Existing passes</h2>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading</p>
      ) : passes.length === 0 ? (
        <p className="text-muted-foreground">No passes yet.</p>
      ) : (
        <div className="space-y-3">
          {passes.map((p) => {
            const usedUp = p.max_uses > 0 && p.uses >= p.max_uses;
            const expired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
            const active = !p.revoked && !usedUp && !expired;
            return (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{p.label || "Untitled pass"}</div>
                    <div className="text-sm text-muted-foreground">
                      Used {p.uses}
                      {p.max_uses > 0 ? ` of ${p.max_uses}` : " times, unlimited"}
                      {p.expires_at
                        ? ` · valid until ${new Date(p.expires_at).toLocaleDateString()}`
                        : " · no expiry"}
                    </div>
                  </div>
                  <Badge variant={active ? "default" : "secondary"}>
                    {p.revoked
                      ? "Turned off"
                      : expired
                        ? "Expired"
                        : usedUp
                          ? "Used up"
                          : "Active"}
                  </Badge>
                </div>
                <code className="block text-xs bg-muted rounded px-2 py-1 break-all">
                  {baseUrl()}/pass/{p.token}
                </code>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void copyLink(p.token)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void revoke(p.id, !p.revoked)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {p.revoked ? "Turn back on" : "Turn off"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminGuestPasses;
