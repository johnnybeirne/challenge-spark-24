import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Crown, Users, Star, Edit2, Package, ExternalLink, UserPlus } from "lucide-react";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

const AdminPromoters = () => {
  const [loading, setLoading] = useState(false);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConversions, setEditConversions] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [tab, setTab] = useState<"promoters" | "applications">("promoters");

  const loadData = async () => {
    setLoading(true);
    const [promoRes, appsRes] = await Promise.all([
      (supabase.from("promoters") as any).select("*").order("created_at", { ascending: false }),
      (supabase.from("partner_contributions") as any).select("*").order("created_at", { ascending: false }),
    ]);
    setPromoters(promoRes.data || []);
    setApplications(appsRes.data || []);

    const allUserIds = [
      ...(promoRes.data || []).map((p: any) => p.user_id),
      ...(appsRes.data || []).map((a: any) => a.user_id),
    ];
    const uniqueIds = [...new Set(allUserIds)];

    if (uniqueIds.length) {
      const { data: prof } = await supabase.from("profiles").select("user_id, name, email").in("user_id", uniqueIds);
      const map = new Map<string, string>();
      (prof || []).forEach(p => map.set(p.user_id, `${p.name || ""} (${p.email || ""})`));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const promoteToPartner = async (p: any) => {
    if (!p.partner_code || !p.user_id) { toast.error("Missing partner_code or user_id"); return; }
    const { data: existing } = await (supabase.from("partners") as any)
      .select("id, slug").eq("user_id", p.user_id).maybeSingle();
    if (existing) { toast.info(`Already a partner (slug: ${existing.slug})`); return; }
    const profile = profiles.get(p.user_id) || "";
    const displayName = profile.split(" (")[0] || null;
    const { error } = await (supabase.from("partners") as any).insert({
      user_id: p.user_id,
      slug: p.partner_code,
      display_name: displayName,
      status: "active",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Promoted to partner (slug: ${p.partner_code})`);
  };

  const approveApplication = async (app: any) => {
    // 1. Update application status
    await (supabase.from("partner_contributions") as any)
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", app.id);

    // 2. Create promoter record
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "jv_";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    await (supabase.from("promoters") as any).insert({
      user_id: app.user_id,
      partner_code: code,
      is_approved: true,
      approved_at: new Date().toISOString(),
    });

    toast.success("Application approved — promoter created!");
    loadData();
  };

  const rejectApplication = async (id: string) => {
    await (supabase.from("partner_contributions") as any)
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    toast.success("Application rejected");
    loadData();
  };

  const pendingApps = applications.filter(a => a.status === "pending");

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "promoters" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("promoters")}
          >
            Promoters ({promoters.length})
          </Button>
          <Button
            variant={tab === "applications" ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setTab("applications")}
          >
            <Package className="h-3 w-3" />
            Applications
            {pendingApps.length > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-xs ml-1">{pendingApps.length}</Badge>
            )}
          </Button>
        </div>

        {/* Stats */}
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

        {/* APPLICATIONS TAB */}
        {tab === "applications" && (
          <div className="space-y-3">
            {applications.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-8">No applications yet</p>
            )}
            {applications.map(app => (
              <Card key={app.id} className={`border-border ${app.status === "pending" ? "border-primary/30" : app.status === "rejected" ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{profiles.get(app.user_id) || app.user_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge className={`text-xs ${
                      app.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                      app.status === "approved" ? "bg-green-500/10 text-green-600" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {app.status}
                    </Badge>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1.5">
                    <p className="text-sm font-medium text-foreground">{app.contribution_title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{app.contribution_description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-foreground font-medium">${app.estimated_value} value</span>
                      {app.contribution_url && (
                        <a
                          href={app.contribution_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary flex items-center gap-0.5 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                    </div>
                  </div>

                  {app.status === "pending" && (
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => approveApplication(app)}>
                        <CheckCircle className="h-3 w-3" /> Approve & Create Partner
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => rejectApplication(app.id)}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* PROMOTERS TAB */}
        {tab === "promoters" && (
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
                      {p.is_founding_partner && <Badge className="text-xs bg-primary/10 text-primary">Founding</Badge>}
                      <Badge className={`text-xs ${p.is_approved ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
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
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-sm font-bold">{p.assessment_starts}</p>
                      <p className="text-xs text-muted-foreground">Assessments</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-sm font-bold capitalize">{p.tier}</p>
                      <p className="text-xs text-muted-foreground">Tier</p>
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
                    <Button size="sm" variant={p.is_approved ? "destructive" : "default"} className="h-7 text-xs gap-1"
                      onClick={() => toggleApproval(p.id, p.is_approved)}>
                      {p.is_approved ? <><XCircle className="h-3 w-3" /> Revoke</> : <><CheckCircle className="h-3 w-3" /> Approve</>}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={() => toggleFounding(p.id, p.is_founding_partner)}>
                      <Star className="h-3 w-3" /> {p.is_founding_partner ? "Unfound" : "Founding"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
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
        )}
      </div>
    </div>
  );
};

export default AdminPromoters;
