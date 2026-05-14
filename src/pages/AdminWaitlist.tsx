import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Mail, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import Spinner from "@/components/Spinner";

type WaitlistRow = {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  referred_by_code: string | null;
  confirmed_invites: number;
  waitlist_position: number;
  status: string;
  current_tier: string;
  created_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

type SortKey =
  | "waitlist_position"
  | "name"
  | "email"
  | "referral_code"
  | "referred_by_code"
  | "confirmed_invites"
  | "current_tier"
  | "status"
  | "created_at";

const AdminWaitlist = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "referred" | "direct" | "active_inviters">("all");
  const [sortKey, setSortKey] = useState<SortKey>("waitlist_position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("waitlist_signups")
        .select("id,email,name,referral_code,referred_by_code,confirmed_invites,waitlist_position,status,current_tier,created_at")
        .order("waitlist_position", { ascending: true })
        .limit(2000);
      setRows((data as WaitlistRow[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "referred") list = list.filter((r) => !!r.referred_by_code);
    if (filter === "direct") list = list.filter((r) => !r.referred_by_code);
    if (filter === "active_inviters") list = list.filter((r) => r.confirmed_invites > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          (r.name || "").toLowerCase().includes(q) ||
          r.referral_code.toLowerCase().includes(q) ||
          (r.referred_by_code || "").toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const aEmpty = av === null || av === undefined || av === "";
      const bEmpty = bv === null || bv === undefined || bv === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (sortKey === "created_at") {
        cmp = new Date(av as string).getTime() - new Date(bv as string).getTime();
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, filter, search, sortKey, sortDir]);

  const totals = useMemo(() => {
    const total = rows.length;
    const referred = rows.filter((r) => r.referred_by_code).length;
    const inviters = rows.filter((r) => r.confirmed_invites > 0).length;
    const totalInvites = rows.reduce((s, r) => s + r.confirmed_invites, 0);
    return { total, referred, inviters, totalInvites };
  }, [rows]);

  const exportCsv = () => {
    const header = ["position", "name", "email", "referral_code", "referred_by_code", "confirmed_invites", "tier", "status", "created_at"];
    const lines = filtered.map((r) =>
      [
        r.waitlist_position,
        JSON.stringify(r.name || ""),
        r.email,
        r.referral_code,
        r.referred_by_code || "",
        r.confirmed_invites,
        r.current_tier,
        r.status,
        r.created_at,
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Mail className="h-5 w-5 text-primary" /> Waitlist
          </h1>
          <p className="text-sm text-muted-foreground">Early-access signups and referral activity.</p>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </header>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total signups", value: totals.total },
          { label: "Referred", value: totals.referred },
          { label: "Active inviters", value: totals.inviters },
          { label: "Total invites", value: totals.totalInvites },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or code…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["referred", "Referred"],
              ["direct", "Direct"],
              ["active_inviters", "Inviters"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {(
                    [
                      ["waitlist_position", "#", "left"],
                      ["name", "Name", "left"],
                      ["email", "Email", "left"],
                      ["referral_code", "Referral code", "left"],
                      ["referred_by_code", "Referred by", "left"],
                      ["confirmed_invites", "Invites", "center"],
                      ["current_tier", "Tier", "left"],
                      ["status", "Status", "left"],
                      ["created_at", "Joined", "left"],
                    ] as Array<[SortKey, string, "left" | "center"]>
                  ).map(([key, label, align]) => {
                    const active = sortKey === key;
                    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th key={key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort(key)}
                          className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground ${
                            active ? "text-foreground" : ""
                          } ${align === "center" ? "mx-auto" : ""}`}
                        >
                          {label}
                          <Icon className="h-3 w-3" />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {r.waitlist_position}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.email}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.referral_code}</code>
                    </td>
                    <td className="px-4 py-3">
                      {r.referred_by_code ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.referred_by_code}</code>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{r.confirmed_invites}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{r.current_tier}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === "active" ? "default" : "outline"} className="text-xs">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No signups match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWaitlist;
