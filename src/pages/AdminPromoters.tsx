import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Shield, CheckCircle, XCircle, Crown, Users, Star, Edit2 } from "lucide-react";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

const ADMIN_PASSWORD = "challengeos2024";

const AdminPromoters = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConversions, setEditConversions] = useState("");

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      loadData();
    } else {
      toast.error("Invalid password");
    }
  };

  const loadData = async () => {
    setLoading(true);
    const { data: promo } = await (supabase.from("promoters") as any).select("*").order("created_at", { ascending: false });
    setPromoters(promo || []);

    if (promo?.length) {
      const ids = promo.map((p: any) => p.user_id);
      const { data: prof } = await supabase.from("profiles").select("user_id, name, email").in("user_id", ids);
      const map = new Map<string, string>();
      (prof || []).forEach(p => map.set(p.user_id, `${p.name || ""} (${p.email || ""})`));
      setProfiles(map);
    }
    setLoading(false);
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await (supabase.from("promoters") as any)
      .update({ is_approved: !current, approved_at: !current ? new Date().toISOString() : null })
      .eq("id", id);
    toast.success(current ? "Promoter removed" : "Promoter approved");
    loadData();
  };

  const toggleFounding = async (id: string, current: boolean) => {
    await (supabase.from("promoters") as any)
      .update({ is_founding_partner: !current })
      .eq("id", id);
    toast.success(!current ? "Tagged as Founding Partner" : "Founding Partner tag removed");
    loadData();
  };

  const updateConversions = async (id: string) => {
    const val = parseInt(editConversions);
    if (isNaN(val) || val < 0) { toast.error("Invalid number"); return; }
    await (supabase.from("promoters") as any).update({ conversions: val }).eq("id", id);
    toast.success("Conversions updated");
    setEditingId(null);
    loadData();
  };

  const deletePromoter = async (id: string) => {
    await (supabase.from("promoters") as any).delete().eq("id", id);
    toast.success("Promoter deleted");
    loadData();
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-bold text-foreground">Admin: Promoters</h1>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-3">
              <Input type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-[44px]" />
              <Button className="w-full min-h-[44px]" disabled={!password}>Access</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[600px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Promoter Management</h1>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card><CardContent className="p-4 text-center">
            <Users className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{promoters.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{promoters.filter(p => p.is_approved).length}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Star className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{promoters.filter(p => p.is_founding_partner).length}</p>
            <p className="text-xs text-muted-foreground">Founding</p>
          </CardContent></Card>
        </div>

        <div className="space-y-3">
          {promoters.map(p => (
            <Card key={p.id} className={`border-border ${!p.is_approved ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{profiles.get(p.user_id) || p.user_id}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.partner_code}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.is_founding_partner && <Badge className="text-[9px] bg-primary/10 text-primary">Founding</Badge>}
                    <Badge className={`text-[9px] ${p.is_approved ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {p.is_approved ? "Approved" : "Pending"}
                    </Badge>
                    <Crown className={`h-3 w-3 ${
                      p.tier === "elite" ? "text-purple-500" :
                      p.tier === "gold" ? "text-yellow-500" :
                      p.tier === "silver" ? "text-gray-400" : "text-amber-600"
                    }`} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-sm font-bold">{p.conversions}</p>
                    <p className="text-[10px] text-muted-foreground">Conversions</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-sm font-bold">{p.assessment_starts}</p>
                    <p className="text-[10px] text-muted-foreground">Assessments</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-sm font-bold capitalize">{p.tier}</p>
                    <p className="text-[10px] text-muted-foreground">Tier</p>
                  </div>
                </div>

                {editingId === p.id ? (
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="number"
                      value={editConversions}
                      onChange={e => setEditConversions(e.target.value)}
                      placeholder="New count"
                      className="h-8 text-xs"
                    />
                    <Button size="sm" className="h-8 text-xs" onClick={() => updateConversions(p.id)}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                ) : null}

                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant={p.is_approved ? "destructive" : "default"} className="h-7 text-[10px] gap-1"
                    onClick={() => toggleApproval(p.id, p.is_approved)}>
                    {p.is_approved ? <><XCircle className="h-3 w-3" /> Revoke</> : <><CheckCircle className="h-3 w-3" /> Approve</>}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                    onClick={() => toggleFounding(p.id, p.is_founding_partner)}>
                    <Star className="h-3 w-3" /> {p.is_founding_partner ? "Unfound" : "Founding"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1"
                    onClick={() => { setEditingId(p.id); setEditConversions(String(p.conversions)); }}>
                    <Edit2 className="h-3 w-3" /> Adjust
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {promoters.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-8">No promoters yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPromoters;
