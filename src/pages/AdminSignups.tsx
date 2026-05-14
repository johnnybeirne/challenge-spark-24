import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";

type Profile = {
  user_id: string;
  email: string | null;
  name: string | null;
  signup_product: string | null;
  entry_intent: string | null;
  referred_by: string | null;
  partner_code_used: string | null;
  is_premium: boolean;
  created_at: string;
};

type ChallengeRow = { user_id: string; current_day: number; completed: boolean; launch_url: string | null };
type TrainingRow = { user_id: string; pre_challenge_watched: boolean; day1_watched: boolean; day2_watched: boolean; day3_watched: boolean; hub_completed: boolean };

const productLabel = (p: string | null) =>
  ({ challenge: "Challenge", blueprint: "Free Course", premium: "Premium Course" } as Record<string, string>)[p || ""] || null;

const intentLabel = (i: string | null) =>
  ({ challenge: "Challenge", free_training: "Free Training", premium_course: "Premium Course" } as Record<string, string>)[i || ""] || null;

type Source = { label: string; variant: "default" | "secondary" | "outline" };
const sourceFor = (r: Profile): Source => {
  if (r.partner_code_used) return { label: `Partner: ${r.partner_code_used}`, variant: "default" };
  if (r.referred_by) return { label: `Referral: ${r.referred_by}`, variant: "secondary" };
  const prod = productLabel(r.signup_product);
  const intent = intentLabel(r.entry_intent);
  if (prod) return { label: `Direct → ${prod}`, variant: "outline" };
  if (intent) return { label: `Direct → ${intent}`, variant: "outline" };
  return { label: "Direct", variant: "outline" };
};

const statusFor = (r: Profile, ch?: ChallengeRow, tr?: TrainingRow): { label: string; variant: "default" | "secondary" | "outline" } => {
  if (r.is_premium) return { label: "Premium course", variant: "default" };
  if (ch?.completed) return { label: "Challenge complete", variant: "default" };
  if (ch && (ch.current_day > 1 || ch.launch_url)) return { label: `Challenge Day ${ch.current_day}`, variant: "secondary" };
  if (tr?.hub_completed) return { label: "Free training done", variant: "secondary" };
  if (tr && (tr.pre_challenge_watched || tr.day1_watched || tr.day2_watched || tr.day3_watched)) {
    const watched = [tr.pre_challenge_watched, tr.day1_watched, tr.day2_watched, tr.day3_watched].filter(Boolean).length;
    return { label: `Free training (${watched})`, variant: "secondary" };
  }
  return { label: "Just signed up", variant: "outline" };
};

const AdminSignups = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Profile[]>([]);
  const [challenge, setChallenge] = useState<Map<string, ChallengeRow>>(new Map());
  const [training, setTraining] = useState<Map<string, TrainingRow>>(new Map());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "partner" | "referral" | "direct" | "active">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: profs } = await (supabase.from("profiles") as any)
        .select("user_id,email,name,signup_product,entry_intent,referred_by,partner_code_used,is_premium,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      const list = (profs as Profile[]) || [];
      setRows(list);
      const ids = list.map((p) => p.user_id);
      if (ids.length) {
        const [chRes, trRes] = await Promise.all([
          (supabase.from("challenge_progress") as any).select("user_id,current_day,completed,launch_url").in("user_id", ids),
          (supabase.from("training_progress") as any).select("user_id,pre_challenge_watched,day1_watched,day2_watched,day3_watched,hub_completed").in("user_id", ids),
        ]);
        const cm = new Map<string, ChallengeRow>();
        ((chRes.data as ChallengeRow[]) || []).forEach((c) => cm.set(c.user_id, c));
        setChallenge(cm);
        const tm = new Map<string, TrainingRow>();
        ((trRes.data as TrainingRow[]) || []).forEach((t) => tm.set(t.user_id, t));
        setTraining(tm);
      }
      setLoading(false);
    })();
  }, []);

  const enriched = useMemo(
    () => rows.map((r) => ({ r, source: sourceFor(r), status: statusFor(r, challenge.get(r.user_id), training.get(r.user_id)) })),
    [rows, challenge, training]
  );

  const counts = useMemo(() => {
    const c = { total: enriched.length, partner: 0, referral: 0, direct: 0, active: 0 };
    enriched.forEach((e) => {
      if (e.r.partner_code_used) c.partner++;
      else if (e.r.referred_by) c.referral++;
      else c.direct++;
      if (e.status.label !== "Just signed up") c.active++;
    });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((e) => {
      const r = e.r;
      if (filter === "partner" && !r.partner_code_used) return false;
      if (filter === "referral" && !(r.referred_by && !r.partner_code_used)) return false;
      if (filter === "direct" && (r.partner_code_used || r.referred_by)) return false;
      if (filter === "active" && e.status.label === "Just signed up") return false;
      if (!q) return true;
      return (
        (r.email || "").toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.referred_by || "").toLowerCase().includes(q) ||
        (r.partner_code_used || "").toLowerCase().includes(q)
      );
    });
  }, [enriched, search, filter]);

  const exportCSV = () => {
    const header = ["Name", "Email", "Signed up", "Source", "Signup product", "Entry intent", "Referred by", "Partner code", "Current status"];
    const lines = filtered.map(({ r, source, status }) => [
      r.name || "",
      r.email || "",
      new Date(r.created_at).toISOString(),
      source.label,
      r.signup_product || "",
      r.entry_intent || "",
      r.referred_by || "",
      r.partner_code_used || "",
      status.label,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="h-6 w-6" /> Signups</h1>
          <p className="text-sm text-muted-foreground">Where they came from, and where they are now.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          ["all", "Total", counts.total],
          ["partner", "Via partner", counts.partner],
          ["referral", "Via referral", counts.referral],
          ["direct", "Direct", counts.direct],
          ["active", "Active", counts.active],
        ] as const).map(([k, label, n]) => (
          <button key={k} onClick={() => setFilter(k as any)} className={`text-left rounded-lg border p-3 transition ${filter === k ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{n}</div>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, partner, referrer…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No signups match.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2 whitespace-nowrap">Signed up</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Current status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ r, source, status }) => (
                  <tr key={r.user_id} className="border-t align-top">
                    <td className="px-4 py-2 font-medium">{r.name || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.email || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2"><Badge variant={source.variant}>{source.label}</Badge></td>
                    <td className="px-4 py-2"><Badge variant={status.variant}>{status.label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSignups;
