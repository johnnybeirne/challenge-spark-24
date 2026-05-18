import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, ExternalLink, Handshake, Pencil, Plus, Power, X, Check } from "lucide-react";

type Partner = {
  id: string;
  slug: string;
  display_name: string | null;
  status: string;
  default_commission_value: number;
  landing_path: string | null;
  notes: string | null;
  created_at: string;
};

type LeaderRow = { partner_id: string; signups: number };

const LANDING_OPTIONS = ["/", "/premium", "/waitlist", "/assess", "/challenge"];
const BASE_URL = "https://leadio.johnnybeirne.com";

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const emptyDraft = {
  slug: "",
  display_name: "",
  landing_path: "/",
  commission: 30,
  notes: "",
};

const AdminJvPartners = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [signups, setSignups] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: pData, error }, { data: lbData }] = await Promise.all([
      supabase
        .from("partners")
        .select("id, slug, display_name, status, default_commission_value, landing_path, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase.rpc("get_partner_leaderboard", { p_limit: 500 }),
    ]);
    if (error) toast.error(error.message);
    setPartners((pData as Partner[]) ?? []);
    const map: Record<string, number> = {};
    ((lbData as LeaderRow[]) ?? []).forEach((r) => { map[r.partner_id] = r.signups; });
    setSignups(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const trackingUrl = (slug: string, landing: string | null) =>
    `${BASE_URL}${landing || "/"}${(landing || "/").includes("?") ? "&" : "?"}ref=${slug}`;

  const copy = async (text: string, label = "Link") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const createPartner = async () => {
    if (!user) return toast.error("Not signed in");
    const slug = slugify(draft.slug);
    if (!slug) return toast.error("Slug required");
    if (partners.some((p) => p.slug === slug)) return toast.error("Slug already in use");
    setSaving(true);
    const { error } = await supabase.from("partners").insert({
      user_id: user.id,
      slug,
      display_name: draft.display_name.trim() || slug,
      status: "active",
      default_commission_type: "percent",
      default_commission_value: Number(draft.commission) || 30,
      landing_path: draft.landing_path || "/",
      notes: draft.notes.trim() || null,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("JV partner code created");
    setDraft(emptyDraft);
    load();
  };

  const toggleStatus = async (p: Partner) => {
    const next = p.status === "active" ? "suspended" : "active";
    const { error } = await supabase.from("partners").update({ status: next } as any).eq("id", p.id);
    if (error) toast.error(error.message);
    else load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(
      (p) => p.slug.toLowerCase().includes(q) || (p.display_name || "").toLowerCase().includes(q),
    );
  }, [partners, search]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Handshake className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">JV Partners</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Mint tracking codes for joint-venture partners. Each code becomes a unique URL — every signup that arrives
        via it is attributed to that partner in Signups and the Leaderboard.
      </p>

      <Card className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New JV partner code
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Slug (URL code)</Label>
            <Input
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              onBlur={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
              placeholder="jane-doe"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Display name</Label>
            <Input
              value={draft.display_name}
              onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <Label>Commission %</Label>
            <Input
              type="number"
              value={draft.commission}
              onChange={(e) => setDraft({ ...draft, commission: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Landing page</Label>
            <select
              value={draft.landing_path}
              onChange={(e) => setDraft({ ...draft, landing_path: e.target.value })}
              className="mt-2 block w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {LANDING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (internal)</Label>
            <Textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="How you met, deal terms, etc."
              rows={2}
            />
          </div>
        </div>
        {draft.slug && (
          <div className="mt-4 text-xs text-muted-foreground font-mono break-all">
            Preview: {trackingUrl(slugify(draft.slug), draft.landing_path)}
          </div>
        )}
        <div className="mt-4">
          <Button onClick={createPartner} disabled={saving}>
            {saving ? "Creating…" : "Create JV partner"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            All partners {loading ? "(loading…)" : `(${filtered.length})`}
          </div>
          <Input
            placeholder="Search slug or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs ml-auto h-9"
          />
        </div>
        <div className="divide-y">
          {filtered.length === 0 && !loading && (
            <div className="p-6 text-sm text-muted-foreground text-center">No partners yet.</div>
          )}
          {filtered.map((p) => {
            const url = trackingUrl(p.slug, p.landing_path);
            return (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-[160px]">
                    <div className="font-mono font-bold">/{p.slug}</div>
                    <div className="text-xs text-muted-foreground">{p.display_name || "—"}</div>
                  </div>
                  <Badge variant={p.status === "active" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                  <Badge variant="secondary">{signups[p.id] ?? 0} signups</Badge>
                  <Badge variant="outline">{p.default_commission_value}%</Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copy(url, "Tracking URL")}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" /> Open
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(p)}>
                      <Power className="h-4 w-4 mr-1" />
                      {p.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground break-all bg-muted/40 rounded px-3 py-2">
                  {url}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default AdminJvPartners;
