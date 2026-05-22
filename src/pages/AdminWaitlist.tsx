import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Mail, ArrowUp, ArrowDown, ArrowUpDown, Trophy, Trash2, Copy, AlertTriangle, ShieldCheck, Ban } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  suspected_self_referral: boolean;
  self_referral_reasons: string[] | null;
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
  | "valid_referrals"
  | "current_tier"
  | "status"
  | "created_at";

const AdminWaitlist = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "referred" | "direct" | "active_inviters" | "flagged">("all");
  const [sortKey, setSortKey] = useState<SortKey>("valid_referrals");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const ok = window.confirm(`Delete ${selected.size} selected signup${selected.size === 1 ? "" : "s"}? This cannot be undone.`);
    if (!ok) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("waitlist_signups").delete().in("id", ids);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    toast.success(`Deleted ${ids.length} signup${ids.length === 1 ? "" : "s"}.`);
  };

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
        .select("id,email,name,referral_code,referred_by_code,confirmed_invites,waitlist_position,status,current_tier,created_at,suspected_self_referral,self_referral_reasons")
        .order("waitlist_position", { ascending: true })
        .limit(2000);
      setRows((data as WaitlistRow[]) || []);
      setLoading(false);
    })();
  }, []);

  // Valid referral counts per inviter (deduped by email, no self-referrals).
  const validRefMap = useMemo(() => {
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
      if (inviter.email && email === inviter.email.toLowerCase().trim()) return;
      if (!seenEmailPerCode.has(ref)) seenEmailPerCode.set(ref, new Set());
      seenEmailPerCode.get(ref)!.add(email);
    });
    const map = new Map<string, number>();
    seenEmailPerCode.forEach((set, code) => {
      const inviter = byCode.get(code);
      if (inviter) map.set(inviter.id, set.size);
    });
    return map;
  }, [rows]);

  const topFiveIds = useMemo(() => {
    const entries = Array.from(validRefMap.entries())
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 5).map(([id]) => id);
  }, [validRefMap]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "referred") list = list.filter((r) => !!r.referred_by_code);
    if (filter === "direct") list = list.filter((r) => !r.referred_by_code);
    if (filter === "active_inviters") list = list.filter((r) => r.confirmed_invites > 0);
    if (filter === "flagged") list = list.filter((r) => r.suspected_self_referral);
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
      let cmp: number;
      if (sortKey === "valid_referrals") {
        cmp = (validRefMap.get(a.id) || 0) - (validRefMap.get(b.id) || 0);
      } else {
        const av = a[sortKey];
        const bv = b[sortKey];
        const aEmpty = av === null || av === undefined || av === "";
        const bEmpty = bv === null || bv === undefined || bv === "";
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else if (sortKey === "created_at") {
          cmp = new Date(av as string).getTime() - new Date(bv as string).getTime();
        } else {
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, filter, search, sortKey, sortDir, validRefMap]);

  const totals = useMemo(() => {
    const total = rows.length;
    const referred = rows.filter((r) => r.referred_by_code).length;
    const inviters = rows.filter((r) => r.confirmed_invites > 0).length;
    const totalInvites = rows.reduce((s, r) => s + r.confirmed_invites, 0);
    return { total, referred, inviters, totalInvites };
  }, [rows]);

  const exportCsv = () => {
    const header = ["position", "name", "email", "referred_by_code", "valid_referrals", "tier", "status", "created_at"];
    const lines = filtered.map((r) =>
      [
        r.waitlist_position,
        JSON.stringify(r.name || ""),
        r.email,
        r.referred_by_code || "",
        validRefMap.get(r.id) || 0,
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
      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { label: "Waitlist (admin)", href: "/owner-console/waitlist" },
          { label: "Waitlist Email", href: "/owner-console/waitlist-email" },
          { label: "Public waitlist page", href: "/waitlist", external: true },
          { label: "Thank-you page", href: "/waitlist/thanks?preview=1", external: true },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noreferrer" : undefined}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {l.label}
          </a>
        ))}
      </nav>
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
            onClick={deleteSelected}
            disabled={selected.size === 0}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete selected ({selected.size})
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
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) filtered.forEach((r) => next.add(r.id));
                          else filtered.forEach((r) => next.delete(r.id));
                          return next;
                        });
                      }}
                    />
                  </th>
                  {(
                    [
                      ["waitlist_position", "#", "left"],
                      ["name", "Name", "left"],
                      ["email", "Email", "left"],
                      ["valid_referrals", "Referrals", "center"],
                      ["referred_by_code", "Referred by", "left"],
                      ["referred_by_code", "Referrer email", "left"],
                      
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
                {filtered.map((r) => {
                  const refs = validRefMap.get(r.id) || 0;
                  const topRank = topFiveIds.indexOf(r.id);
                  const isTop = topRank >= 0;
                  const rowCls = isTop
                    ? "border-b last:border-0 bg-amber-500/5 hover:bg-amber-500/10"
                    : "border-b last:border-0 hover:bg-muted/20";
                  const rankChipCls = [
                    "bg-amber-400/20 text-amber-800 ring-amber-500/40",
                    "bg-zinc-400/20 text-zinc-800 ring-zinc-500/40",
                    "bg-orange-700/15 text-orange-900 ring-orange-700/40",
                    "bg-amber-400/10 text-amber-800 ring-amber-400/30",
                    "bg-amber-400/10 text-amber-800 ring-amber-400/30",
                  ];
                  return (
                  <tr key={r.id} className={rowCls}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.email}`}
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {isTop ? (
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ${rankChipCls[topRank]}`}>
                          {topRank + 1}
                        </span>
                      ) : (
                        r.waitlist_position
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1.5 w-full">
                        {topRank === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <Input
                          defaultValue={r.name || ""}
                          placeholder="—"
                          className="h-8 px-2 py-1 border-transparent hover:border-input focus:border-input bg-transparent"
                          onBlur={async (e) => {
                            const newName = e.target.value.trim();
                            const current = (r.name || "").trim();
                            if (newName === current) return;
                            const { error } = await supabase
                              .from("waitlist_signups")
                              .update({ name: newName || null })
                              .eq("id", r.id);
                            if (error) {
                              toast.error(`Failed to update name: ${error.message}`);
                              return;
                            }
                            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, name: newName || null } : x)));
                            toast.success("Name updated.");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") {
                              (e.target as HTMLInputElement).value = r.name || "";
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                        />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={isTop ? "font-semibold text-amber-700" : "font-semibold"}>
                        {refs}
                      </span>
                    </td>
                    {(() => {
                      const inviter = r.referred_by_code
                        ? rows.find((x) => x.referral_code === r.referred_by_code)
                        : null;
                      return (
                        <>
                          <td className="px-4 py-3">
                            {r.referred_by_code ? (
                              <span className="text-sm">
                                {inviter?.name || inviter?.email || r.referred_by_code}
                              </span>
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
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
