import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Mail, ArrowUp, ArrowDown, ArrowUpDown, Trophy, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
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

  // Referral leaderboard — count unique valid referrals per referral_code.
  // Rules: dedupe by lowercase email, exclude self-referrals, exclude blank referred_by_code.
  const leaderboard = useMemo(() => {
    const byCode = new Map<string, WaitlistRow>();
    rows.forEach((r) => {
      if (r.referral_code) byCode.set(r.referral_code, r);
    });
    const seenEmailPerCode = new Map<string, Set<string>>();
    rows.forEach((r) => {
      const ref = r.referred_by_code;
      if (!ref) return;
      const inviter = byCode.get(ref);
      if (!inviter) return;
      const email = (r.email || "").toLowerCase().trim();
      if (!email) return;
      // exclude self-referrals
      if (inviter.email && email === inviter.email.toLowerCase().trim()) return;
      if (!seenEmailPerCode.has(ref)) seenEmailPerCode.set(ref, new Set());
      seenEmailPerCode.get(ref)!.add(email);
    });
    const list = Array.from(seenEmailPerCode.entries())
      .map(([code, set]) => {
        const inviter = byCode.get(code)!;
        const valid = set.size;
        let reward: "none" | "bonus" | "review" = "none";
        if (valid >= 3) reward = "bonus";
        // Flag review if reported confirmed_invites disagrees significantly
        if (Math.abs((inviter.confirmed_invites || 0) - valid) >= 2) reward = "review";
        return { inviter, valid, reward };
      })
      .filter((x) => x.valid > 0)
      .sort((a, b) => b.valid - a.valid || new Date(a.inviter.created_at).getTime() - new Date(b.inviter.created_at).getTime());
    return list;
  }, [rows]);

  const firstName = (full: string | null | undefined) =>
    (full || "").trim().split(/\s+/)[0] || "—";

  const rewardBadge = (r: "none" | "bonus" | "review") => {
    if (r === "bonus") return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">Bonus extras unlocked</Badge>;
    if (r === "review") return <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">Review manually</Badge>;
    return <Badge variant="secondary" className="text-xs">No reward yet</Badge>;
  };

  const exportCsv = () => {
    const header = ["position", "name", "email", "referred_by_code", "confirmed_invites", "tier", "status", "created_at"];
    const lines = filtered.map((r) =>
      [
        r.waitlist_position,
        JSON.stringify(r.name || ""),
        r.email,
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
    <div className="space-y-6 p-6 text-[14px] [&_*]:!text-[14px]">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Mail className="h-5 w-5 text-primary" /> Waitlist
          </h1>
          <p className="text-sm text-muted-foreground">Early-access signups and referral activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportCsv} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={async () => {
              if (rows.length === 0) {
                toast.info("Waitlist is already empty.");
                return;
              }
              const ok = window.confirm(
                `Delete all ${rows.length} waitlist signups? This cannot be undone.`,
              );
              if (!ok) return;
              const { error } = await supabase
                .from("waitlist_signups")
                .delete()
                .not("id", "is", null);
              if (error) {
                toast.error(`Failed to empty waitlist: ${error.message}`);
                return;
              }
              setRows([]);
              toast.success("Waitlist emptied.");
            }}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Empty waitlist
          </Button>
        </div>
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

      {/* Referral Leaderboard */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Referral Leaderboard</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">First name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Valid referrals</th>
                  <th className="px-4 py-3">Referred by</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Reward status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 100).map((entry, idx) => (
                  <tr key={entry.inviter.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{firstName(entry.inviter.name)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.inviter.email}</td>
                    <td className="px-4 py-3 text-center font-semibold">{entry.valid}</td>
                    <td className="px-4 py-3">
                      {entry.inviter.referred_by_code ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{entry.inviter.referred_by_code}</code>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(entry.inviter.created_at)}</td>
                    <td className="px-4 py-3">{rewardBadge(entry.reward)}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No valid referrals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                      
                      ["referred_by_code", "Referred by", "left"],
                      ["referred_by_code", "Referrer email", "left"],
                      ["confirmed_invites", "Invites", "center"],
                      ["current_tier", "Tier", "left"],
                      ["status", "Status", "left"],
                      ["created_at", "Joined", "left"],
                    ] as Array<[SortKey, string, "left" | "center"]>
                  ).map(([key, label, align], idx) => {
                    const active = sortKey === key;
                    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th key={`${key}-${idx}`} className="px-4 py-3">
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
                    {(() => {
                      const inviter = r.referred_by_code
                        ? rows.find((x) => x.referral_code === r.referred_by_code)
                        : null;
                      return (
                        <>
                          <td className="px-4 py-3">
                            {r.referred_by_code ? (
                              inviter?.name ? (
                                <span className="text-sm">{inviter.name}</span>
                              ) : (
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.referred_by_code}</code>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">Direct</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {inviter?.email ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="truncate">{inviter.email}</span>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await navigator.clipboard.writeText(inviter.email);
                                      toast.success("Email copied");
                                    } catch {
                                      toast.error("Failed to copy");
                                    }
                                  }}
                                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  aria-label={`Copy ${inviter.email}`}
                                  title="Copy email"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </>
                      );
                    })()}
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
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
