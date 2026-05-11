import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, UserPlus } from "lucide-react";
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

const productLabel = (p: string | null) =>
  ({ challenge: "Challenge", blueprint: "Free Course", premium: "Premium Course" } as Record<string, string>)[p || ""] || "—";

const intentLabel = (i: string | null) =>
  ({ challenge: "Challenge", free_training: "Free Training", premium_course: "Premium Course" } as Record<string, string>)[i || ""] || "—";

const productVariant = (p: string | null) => {
  if (p === "premium") return "default" as const;
  if (p === "challenge") return "secondary" as const;
  if (p === "blueprint") return "outline" as const;
  return "outline" as const;
};

const AdminSignups = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "challenge" | "blueprint" | "premium" | "unknown">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("profiles") as any)
        .select("user_id,email,name,signup_product,entry_intent,referred_by,partner_code_used,is_premium,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      setRows((data as Profile[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all") {
        if (filter === "unknown") {
          if (r.signup_product) return false;
        } else if (r.signup_product !== filter) return false;
      }
      if (!q) return true;
      return (
        (r.email || "").toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.referred_by || "").toLowerCase().includes(q) ||
        (r.partner_code_used || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, filter]);

  const counts = useMemo(() => {
    const c = { total: rows.length, challenge: 0, blueprint: 0, premium: 0, unknown: 0 };
    rows.forEach((r) => {
      if (r.signup_product === "challenge") c.challenge++;
      else if (r.signup_product === "blueprint") c.blueprint++;
      else if (r.signup_product === "premium") c.premium++;
      else c.unknown++;
    });
    return c;
  }, [rows]);

  const exportCSV = () => {
    const header = ["Name", "Email", "Signed up", "Signup product", "Entry intent", "Referred by", "Partner code", "Premium"];
    const lines = filtered.map((r) => [
      r.name || "",
      r.email || "",
      new Date(r.created_at).toISOString(),
      r.signup_product || "",
      r.entry_intent || "",
      r.referred_by || "",
      r.partner_code_used || "",
      r.is_premium ? "yes" : "no",
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
          <p className="text-sm text-muted-foreground">Every account, tagged by where they came in.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          ["all", "Total", counts.total],
          ["challenge", "Challenge", counts.challenge],
          ["blueprint", "Free Course", counts.blueprint],
          ["premium", "Premium", counts.premium],
          ["unknown", "Untagged", counts.unknown],
        ] as const).map(([k, label, n]) => (
          <button key={k} onClick={() => setFilter(k as any)} className={`text-left rounded-lg border p-3 transition ${filter === k ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{n}</div>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, referrer…" className="pl-9" />
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
                  <th className="px-4 py-2">Signed up</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Entry intent</th>
                  <th className="px-4 py-2">Referred by</th>
                  <th className="px-4 py-2">Partner</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.user_id} className="border-t">
                    <td className="px-4 py-2 font-medium">{r.name || "—"} {r.is_premium && <Badge variant="default" className="ml-1">Premium</Badge>}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.email || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2"><Badge variant={productVariant(r.signup_product)}>{productLabel(r.signup_product)}</Badge></td>
                    <td className="px-4 py-2"><Badge variant="outline">{intentLabel(r.entry_intent)}</Badge></td>
                    <td className="px-4 py-2 text-muted-foreground">{r.referred_by || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.partner_code_used || "—"}</td>
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
