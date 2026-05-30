import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Search,
  User as UserIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Trophy,
  AlertTriangle,
  ShieldCheck,
  Ban,
  Copy,
  Download,
  Trash2,
  MoreHorizontal,
  Pencil,
  X,
} from "lucide-react";
import Spinner from "@/components/Spinner";

type Source = "profile" | "waitlist";

interface BioRow {
  sources: Source[];
  key: string;
  profile_user_id: string | null;
  waitlist_id: string | null;
  email: string | null;
  name: string | null;
  first_name: string | null;
  surname: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  created_at: string | null;
  referral_code: string | null;
  referred_by_code: string | null;
  referred_by_email: string | null;
  referred_by_name: string | null;
  confirmed_invites: number | null;
  current_tier: string | null;
  waitlist_position: number | null;
  status: string | null;
  suspected_self_referral: boolean;
  self_referral_reasons: string[] | null;
}

type SortKey = "name" | "created_at" | "valid_referrals" | "waitlist_position" | "current_tier";
type SortDir = "asc" | "desc";
type FilterKey = "all" | "buyers" | "waitlist" | "referred" | "direct" | "active_inviters" | "flagged";

const pick = <T,>(a: T | null | undefined, b: T | null | undefined): T | null =>
  (a ?? null) || (b ?? null) || null;

const earlier = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
};

const formatFull = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

const formatRelative = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "—";
  }
};

const copyText = async (v: string | null | undefined, label = "Copied") => {
  if (!v) return;
  try {
    await navigator.clipboard.writeText(v);
    toast.success(label);
  } catch {
    toast.error("Copy failed");
  }
};

const TEST_EMAIL_RE = /^test\+[^@]*@leadio\.test$|@leadio\.local$/i;
const isTestEmail = (email: string | null | undefined) => !!email && TEST_EMAIL_RE.test(email.trim());

const displayName = (r: BioRow) =>
  r.name || [r.first_name, r.surname].filter(Boolean).join(" ") || r.email || "Unnamed";

const rankChipCls = [
  "bg-amber-400/20 text-amber-800 ring-amber-500/40",
  "bg-zinc-400/20 text-zinc-800 ring-zinc-500/40",
  "bg-orange-700/15 text-orange-900 ring-orange-700/40",
  "bg-amber-400/10 text-amber-800 ring-amber-400/30",
  "bg-amber-400/10 text-amber-800 ring-amber-400/30",
];

const AdminBios = () => {
  const [rows, setRows] = useState<BioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [openRow, setOpenRow] = useState<BioRow | null>(null);
  const [draft, setDraft] = useState<Partial<BioRow>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [profilesRes, waitlistRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "user_id, email, name, first_name, surname, bio, avatar_url, linkedin_url, facebook_url, instagram_url, youtube_url, website_url, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("waitlist_signups")
        .select(
          "id, email, name, first_name, surname, bio, avatar_url, linkedin_url, facebook_url, instagram_url, youtube_url, website_url, created_at, referral_code, referred_by_code, confirmed_invites, current_tier, waitlist_position, status, suspected_self_referral, self_referral_reasons"
        )
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);

    if (profilesRes.error) toast.error("Could not load profiles");
    if (waitlistRes.error) toast.error("Could not load waitlist");

    const waitlistList = waitlistRes.data || [];
    const codeToWaitlist = new Map<string, { email: string | null; name: string | null }>();
    for (const w of waitlistList) {
      if (w.referral_code) codeToWaitlist.set(w.referral_code, { email: w.email, name: w.name });
    }

    const map = new Map<string, BioRow>();
    for (const p of profilesRes.data || []) {
      const key = (p.email || `profile:${p.user_id}`).toLowerCase();
      map.set(key, {
        sources: ["profile"],
        key,
        profile_user_id: p.user_id,
        waitlist_id: null,
        email: p.email,
        name: p.name,
        first_name: p.first_name,
        surname: p.surname,
        bio: p.bio,
        avatar_url: p.avatar_url,
        linkedin_url: p.linkedin_url,
        facebook_url: p.facebook_url,
        instagram_url: p.instagram_url,
        youtube_url: p.youtube_url,
        website_url: p.website_url,
        created_at: p.created_at,
        referral_code: null,
        referred_by_code: null,
        referred_by_email: null,
        referred_by_name: null,
        confirmed_invites: null,
        current_tier: null,
        waitlist_position: null,
        status: null,
        suspected_self_referral: false,
        self_referral_reasons: null,
      });
    }

    for (const w of waitlistList) {
      const key = (w.email || `waitlist:${w.id}`).toLowerCase();
      const inviter = w.referred_by_code ? codeToWaitlist.get(w.referred_by_code) : null;
      const existing = map.get(key);
      if (existing) {
        existing.sources = Array.from(new Set([...existing.sources, "waitlist"])) as Source[];
        existing.waitlist_id = w.id;
        existing.name = pick(existing.name, w.name);
        existing.first_name = pick(existing.first_name, w.first_name);
        existing.surname = pick(existing.surname, w.surname);
        existing.bio = pick(existing.bio, w.bio);
        existing.avatar_url = pick(existing.avatar_url, w.avatar_url);
        existing.linkedin_url = pick(existing.linkedin_url, w.linkedin_url);
        existing.facebook_url = pick(existing.facebook_url, w.facebook_url);
        existing.instagram_url = pick(existing.instagram_url, w.instagram_url);
        existing.youtube_url = pick(existing.youtube_url, w.youtube_url);
        existing.website_url = pick(existing.website_url, w.website_url);
        existing.created_at = earlier(existing.created_at, w.created_at);
        existing.referral_code = w.referral_code ?? null;
        existing.referred_by_code = w.referred_by_code ?? null;
        existing.referred_by_email = inviter?.email ?? null;
        existing.referred_by_name = inviter?.name ?? null;
        existing.confirmed_invites = w.confirmed_invites ?? null;
        existing.current_tier = w.current_tier ?? null;
        existing.waitlist_position = w.waitlist_position ?? null;
        existing.status = w.status ?? null;
        existing.suspected_self_referral = !!w.suspected_self_referral;
        existing.self_referral_reasons = w.self_referral_reasons ?? null;
      } else {
        map.set(key, {
          sources: ["waitlist"],
          key,
          profile_user_id: null,
          waitlist_id: w.id,
          email: w.email,
          name: w.name,
          first_name: w.first_name,
          surname: w.surname,
          bio: w.bio,
          avatar_url: w.avatar_url,
          linkedin_url: w.linkedin_url,
          facebook_url: w.facebook_url,
          instagram_url: w.instagram_url,
          youtube_url: w.youtube_url,
          website_url: w.website_url,
          created_at: w.created_at,
          referral_code: w.referral_code ?? null,
          referred_by_code: w.referred_by_code ?? null,
          referred_by_email: inviter?.email ?? null,
          referred_by_name: inviter?.name ?? null,
          confirmed_invites: w.confirmed_invites ?? null,
          current_tier: w.current_tier ?? null,
          waitlist_position: w.waitlist_position ?? null,
          status: w.status ?? null,
          suspected_self_referral: !!w.suspected_self_referral,
          self_referral_reasons: w.self_referral_reasons ?? null,
        });
      }
    }

    setRows(Array.from(map.values()).filter((r) => !isTestEmail(r.email)));
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const validRefMap = useMemo(() => {
    const byCode = new Map<string, BioRow>();
    rows.forEach((r) => {
      if (r.referral_code) byCode.set(r.referral_code, r);
    });
    const seen = new Map<string, Set<string>>();
    rows.forEach((r) => {
      const ref = r.referred_by_code;
      if (!ref) return;
      const inviter = byCode.get(ref);
      if (!inviter) return;
      const email = (r.email || "").toLowerCase().trim();
      if (!email) return;
      if (inviter.email && email === inviter.email.toLowerCase().trim()) return;
      if (!seen.has(ref)) seen.set(ref, new Set());
      seen.get(ref)!.add(email);
    });
    const map = new Map<string, number>();
    seen.forEach((set, code) => {
      const inviter = byCode.get(code);
      if (inviter) map.set(inviter.key, set.size);
    });
    return map;
  }, [rows]);

  const topFiveKeys = useMemo(
    () =>
      Array.from(validRefMap.entries())
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k),
    [validRefMap]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fromT = joinedFrom ? new Date(joinedFrom).getTime() : null;
    const toT = joinedTo ? new Date(joinedTo).getTime() + 86_400_000 : null;
    const out = rows.filter((r) => {
      if (
        s &&
        ![r.name, r.first_name, r.surname, r.email, r.referral_code, r.referred_by_code]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s))
      )
        return false;
      if (fromT || toT) {
        const t = r.created_at ? new Date(r.created_at).getTime() : 0;
        if (fromT && t < fromT) return false;
        if (toT && t >= toT) return false;
      }
      if (filter === "buyers" && !r.sources.includes("profile")) return false;
      if (filter === "waitlist" && !r.sources.includes("waitlist")) return false;
      if (filter === "referred" && !r.referred_by_code) return false;
      if (filter === "direct" && r.referred_by_code) return false;
      if (filter === "active_inviters" && (validRefMap.get(r.key) ?? 0) <= 0) return false;
      if (filter === "flagged" && !r.suspected_self_referral) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "created_at") {
        av = a.created_at ? new Date(a.created_at).getTime() : 0;
        bv = b.created_at ? new Date(b.created_at).getTime() : 0;
      } else if (sortKey === "valid_referrals") {
        av = validRefMap.get(a.key) ?? 0;
        bv = validRefMap.get(b.key) ?? 0;
      } else if (sortKey === "waitlist_position") {
        av = a.waitlist_position ?? Number.POSITIVE_INFINITY;
        bv = b.waitlist_position ?? Number.POSITIVE_INFINITY;
      } else if (sortKey === "name") {
        av = displayName(a).toLowerCase();
        bv = displayName(b).toLowerCase();
      } else {
        av = String((a as any)[sortKey] || "").toLowerCase();
        bv = String((b as any)[sortKey] || "").toLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return out;
  }, [rows, q, joinedFrom, joinedTo, sortKey, sortDir, filter, validRefMap]);

  const totals = useMemo(() => {
    const total = rows.length;
    const buyers = rows.filter((r) => r.sources.includes("profile")).length;
    const waitlist = rows.filter((r) => r.sources.includes("waitlist")).length;
    const referred = rows.filter((r) => !!r.referred_by_code).length;
    const direct = rows.filter((r) => !r.referred_by_code && r.sources.includes("waitlist")).length;
    const inviters = Array.from(validRefMap.values()).filter((n) => n > 0).length;
    const totalInvites = rows.reduce((s, r) => s + (validRefMap.get(r.key) ?? 0), 0);
    const flagged = rows.filter((r) => r.suspected_self_referral).length;
    return { total, buyers, waitlist, referred, direct, inviters, totalInvites, flagged };
  }, [rows, validRefMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "created_at" || key === "valid_referrals" ? "desc" : "asc");
    }
  };

  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const deleteSelected = async () => {
    const ids = filtered
      .filter((r) => selected.has(r.key) && r.waitlist_id)
      .map((r) => r.waitlist_id!) as string[];
    if (ids.length === 0) {
      toast.info("Only waitlist rows can be deleted here.");
      return;
    }
    if (!window.confirm(`Delete ${ids.length} waitlist signup${ids.length === 1 ? "" : "s"}? This cannot be undone.`))
      return;
    const { error } = await supabase.from("waitlist_signups").delete().in("id", ids);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return;
    }
    toast.success(`Deleted ${ids.length} signup${ids.length === 1 ? "" : "s"}.`);
    await load();
  };

  const deleteOne = async (r: BioRow) => {
    if (!r.waitlist_id) {
      toast.info("Only waitlist rows can be deleted.");
      return;
    }
    if (!window.confirm(`Delete waitlist signup for ${r.email}? This cannot be undone.`)) return;
    const { error } = await supabase.from("waitlist_signups").delete().eq("id", r.waitlist_id);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success("Deleted.");
    setOpenRow(null);
    await load();
  };

  const clearFlag = async (r: BioRow) => {
    if (!r.waitlist_id) return;
    const { error } = await supabase.rpc("admin_clear_self_referral_flag", { p_signup_id: r.waitlist_id });
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    setRows((prev) =>
      prev.map((x) =>
        x.key === r.key ? { ...x, suspected_self_referral: false, self_referral_reasons: [] } : x
      )
    );
    if (openRow?.key === r.key) {
      setOpenRow({ ...openRow, suspected_self_referral: false, self_referral_reasons: [] });
    }
    toast.success("Marked as valid.");
  };

  const voidReferral = async (r: BioRow) => {
    if (!r.waitlist_id) return;
    if (!window.confirm(`Void referral from ${r.email}? This decrements the referrer's invite count.`)) return;
    const { error } = await supabase.rpc("admin_void_waitlist_referral", { p_signup_id: r.waitlist_id });
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success("Referral voided.");
    await load();
  };

  const openDrawer = (r: BioRow) => {
    setOpenRow(r);
    setDraft({
      name: r.name || [r.first_name, r.surname].filter(Boolean).join(" ") || "",
      bio: r.bio || "",
      linkedin_url: r.linkedin_url || "",
      facebook_url: r.facebook_url || "",
      instagram_url: r.instagram_url || "",
      youtube_url: r.youtube_url || "",
      website_url: r.website_url || "",
    });
  };

  const saveDrawer = async () => {
    if (!openRow) return;
    setSaving(true);
    const full = ((draft.name as string) || "").trim();
    const parts = full.split(/\s+/);
    const first = parts.shift() || null;
    const surname = parts.join(" ") || null;
    const payload = {
      name: full || null,
      first_name: first,
      surname,
      bio: (draft.bio as string) ?? null,
      linkedin_url: draft.linkedin_url || null,
      facebook_url: draft.facebook_url || null,
      instagram_url: draft.instagram_url || null,
      youtube_url: draft.youtube_url || null,
      website_url: draft.website_url || null,
    };
    const ops: Promise<{ error: unknown }>[] = [];
    if (openRow.profile_user_id) {
      ops.push(
        supabase.from("profiles").update(payload).eq("user_id", openRow.profile_user_id) as unknown as Promise<{ error: unknown }>
      );
    }
    if (openRow.waitlist_id) {
      ops.push(
        supabase.from("waitlist_signups").update(payload).eq("id", openRow.waitlist_id) as unknown as Promise<{ error: unknown }>
      );
    }
    const results = await Promise.all(ops);
    setSaving(false);
    if (results.some((x) => x.error)) {
      toast.error("Could not save");
      return;
    }
    toast.success("Saved");
    setOpenRow(null);
    await load();
  };

  const exportCsv = () => {
    const header = [
      "name",
      "email",
      "joined",
      "source",
      "refs",
      "referred_by_email",
      "referred_by_code",
      "tier",
      "status",
      "waitlist_position",
      "flagged",
    ];
    const lines = filtered.map((r) =>
      [
        JSON.stringify(displayName(r)),
        r.email || "",
        r.created_at || "",
        r.sources.join("+"),
        validRefMap.get(r.key) ?? 0,
        r.referred_by_email || "",
        r.referred_by_code || "",
        r.current_tier || "",
        r.status || "",
        r.waitlist_position ?? "",
        r.suspected_self_referral ? "yes" : "",
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-bios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({
    k,
    label,
    align = "left",
    className = "",
  }: {
    k: SortKey;
    label: string;
    align?: "left" | "right";
    className?: string;
  }) => {
    const active = sortKey === k;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th
        className={`px-3 py-2.5 whitespace-nowrap select-none ${
          align === "right" ? "text-right" : "text-left"
        } ${active ? "bg-muted/60 text-foreground" : ""} ${className}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground hover:underline underline-offset-2 ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
        >
          <span>{label}</span>
          <Icon className={`h-3 w-3 ${active ? "opacity-100" : "opacity-50"}`} />
        </button>
      </th>
    );
  };

  const filterPills: { key: FilterKey; label: string; count: number; tone?: string }[] = [
    { key: "all", label: "All", count: totals.total },
    { key: "buyers", label: "Buyers", count: totals.buyers },
    { key: "waitlist", label: "Waitlist", count: totals.waitlist },
    { key: "referred", label: "Referred", count: totals.referred },
    { key: "direct", label: "Direct", count: totals.direct },
    { key: "active_inviters", label: "Referrers", count: totals.inviters },
    { key: "flagged", label: "⚠ Flagged", count: totals.flagged, tone: "flagged" },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Registrants</h1>
          <p className="text-sm text-muted-foreground">
            Merged view of buyers & waitlist signups. Click a row for full details.
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-5">
        {[
          { label: "Total people", value: totals.total },
          { label: "Active referrers", value: totals.inviters },
          { label: "Valid referrals", value: totals.totalInvites },
          { label: "Flagged", value: totals.flagged, danger: totals.flagged > 0 },
        ].map((s) => (
          <Card key={s.label} className={s.danger ? "border-amber-500/40" : ""}>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.danger ? "text-amber-700" : ""}`}>
                {s.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, code…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Input
          type="date"
          value={joinedFrom}
          onChange={(e) => setJoinedFrom(e.target.value)}
          className="h-9 w-[150px]"
          aria-label="Joined from"
        />
        <span className="text-muted-foreground text-sm">→</span>
        <Input
          type="date"
          value={joinedTo}
          onChange={(e) => setJoinedTo(e.target.value)}
          className="h-9 w-[150px]"
          aria-label="Joined to"
        />
        <Select value={`${sortKey}:${sortDir}`} onValueChange={(v) => {
          const [k, d] = v.split(":") as [SortKey, SortDir];
          setSortKey(k);
          setSortDir(d);
        }}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at:desc">Newest first</SelectItem>
            <SelectItem value="created_at:asc">Oldest first</SelectItem>
            <SelectItem value="valid_referrals:desc">Most refs</SelectItem>
            <SelectItem value="name:asc">Name A–Z</SelectItem>
            <SelectItem value="waitlist_position:asc">Waitlist position</SelectItem>
          </SelectContent>
        </Select>
        {(q || joinedFrom || joinedTo || filter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setJoinedFrom("");
              setJoinedTo("");
              setFilter("all");
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {filterPills.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === p.key
                ? p.tone === "flagged"
                  ? "border-amber-500 bg-amber-500/10 text-amber-800"
                  : "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {p.label}
            <span
              className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                filter === p.key && p.tone !== "flagged"
                  ? "bg-primary-foreground/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {p.count}
            </span>
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground mb-2">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {rows.length}
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No people match the filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
                    <tr className="border-b">
                      <th className="px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          checked={filtered.length > 0 && filtered.every((r) => selected.has(r.key))}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) filtered.forEach((r) => next.add(r.key));
                              else filtered.forEach((r) => next.delete(r.key));
                              return next;
                            });
                          }}
                        />
                      </th>
                      <SortHeader k="name" label="Person" />
                      <SortHeader k="created_at" label="Joined" />
                      <SortHeader k="valid_referrals" label="Refs" align="right" />
                      <th className="px-3 py-2.5 text-left">Context</th>
                      <th className="px-3 py-2.5 text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const refs = validRefMap.get(r.key) ?? 0;
                      const topRank = topFiveKeys.indexOf(r.key);
                      const isTop = topRank >= 0;
                      const isBuyer = r.sources.includes("profile");
                      const isWaitlist = r.sources.includes("waitlist");
                      const rowCls = `border-b last:border-0 cursor-pointer transition ${
                        isTop ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/30"
                      } ${selected.has(r.key) ? "bg-primary/5" : ""}`;
                      return (
                        <tr
                          key={r.key}
                          className={rowCls}
                          onClick={() => openDrawer(r)}
                        >
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Select ${r.email}`}
                              checked={selected.has(r.key)}
                              onChange={() => toggleOne(r.key)}
                            />
                          </td>
                          {/* Person */}
                          <td className="px-3 py-3 min-w-[260px]">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-border">
                                {r.avatar_url ? (
                                  <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isTop && (
                                    <Trophy
                                      className={`h-3.5 w-3.5 shrink-0 ${
                                        topRank === 0 ? "text-amber-500" : "text-amber-500/60"
                                      }`}
                                    />
                                  )}
                                  <span className="font-medium truncate">{displayName(r)}</span>
                                  {r.suspected_self_referral && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-500/40">
                                            <AlertTriangle className="h-2.5 w-2.5" />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>Suspected self-referral</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                                  <span className="truncate">{r.email || "no email"}</span>
                                  {isBuyer && (
                                    <Badge variant="secondary" className="text-[9px] py-0 h-3.5 px-1.5">
                                      Buyer
                                    </Badge>
                                  )}
                                  {isWaitlist && (
                                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 px-1.5">
                                      Waitlist
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Joined */}
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{formatRelative(r.created_at)}</span>
                                </TooltipTrigger>
                                <TooltipContent>{formatFull(r.created_at)}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          {/* Refs */}
                          <td className="px-3 py-3 text-right tabular-nums">
                            {isTop ? (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${rankChipCls[topRank]}`}
                              >
                                #{topRank + 1} · {refs}
                              </span>
                            ) : refs > 0 ? (
                              <span className="font-semibold">{refs}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          {/* Context */}
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-[340px]">
                            <div className="truncate">
                              {isWaitlist && (
                                <>
                                  {r.waitlist_position != null && (
                                    <span className="font-mono">#{r.waitlist_position}</span>
                                  )}
                                  {r.current_tier && (
                                    <>
                                      {r.waitlist_position != null && " · "}
                                      <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                                        {r.current_tier}
                                      </Badge>
                                    </>
                                  )}
                                  {r.referred_by_code ? (
                                    <>
                                      {" · "}via {r.referred_by_name || r.referred_by_email || r.referred_by_code}
                                    </>
                                  ) : (
                                    <> · Direct</>
                                  )}
                                </>
                              )}
                              {!isWaitlist && isBuyer && <span>Buyer profile</span>}
                            </div>
                          </td>
                          {/* Actions */}
                          <td
                            className="px-3 py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDrawer(r)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit bio
                                </DropdownMenuItem>
                                {r.email && (
                                  <DropdownMenuItem onClick={() => copyText(r.email, "Email copied")}>
                                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy email
                                  </DropdownMenuItem>
                                )}
                                {r.suspected_self_referral && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => clearFlag(r)}>
                                      <ShieldCheck className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Mark valid
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => voidReferral(r)}>
                                      <Ban className="h-3.5 w-3.5 mr-2 text-destructive" /> Void referral
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {r.waitlist_id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => deleteOne(r)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete signup
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteSelected} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={!!openRow} onOpenChange={(o) => !o && setOpenRow(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {openRow && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border">
                    {openRow.avatar_url ? (
                      <img src={openRow.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="truncate">{displayName(openRow)}</div>
                    <div className="text-xs font-normal text-muted-foreground truncate flex items-center gap-1.5">
                      {openRow.email || "no email"}
                      {openRow.email && (
                        <button
                          type="button"
                          onClick={() => copyText(openRow.email)}
                          className="hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {openRow.sources.includes("profile") && <Badge variant="secondary">Buyer</Badge>}
                {openRow.sources.includes("waitlist") && <Badge variant="outline">Waitlist</Badge>}
                <Badge variant="outline" className="text-muted-foreground">
                  Joined {formatRelative(openRow.created_at)}
                </Badge>
                {(validRefMap.get(openRow.key) ?? 0) > 0 && (
                  <Badge>{validRefMap.get(openRow.key)} valid refs</Badge>
                )}
              </div>

              {openRow.suspected_self_referral && (
                <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Suspected self-referral
                  </div>
                  {openRow.self_referral_reasons && openRow.self_referral_reasons.length > 0 && (
                    <ul className="mt-1.5 ml-5 list-disc text-xs text-amber-800">
                      {openRow.self_referral_reasons.map((reason) => (
                        <li key={reason}>{reason.replace(/_/g, " ")}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => clearFlag(openRow)} className="gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Mark valid
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => voidReferral(openRow)} className="gap-1.5">
                      <Ban className="h-3.5 w-3.5" /> Void referral
                    </Button>
                  </div>
                </div>
              )}

              {openRow.sources.includes("waitlist") && (
                <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Position</div>
                    <div className="font-medium">
                      {openRow.waitlist_position != null ? `#${openRow.waitlist_position}` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tier</div>
                    <div className="font-medium">{openRow.current_tier || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">{openRow.status || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Confirmed invites</div>
                    <div className="font-medium">{openRow.confirmed_invites ?? 0}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Referred by</div>
                    <div className="font-medium truncate">
                      {openRow.referred_by_code
                        ? `${openRow.referred_by_name || openRow.referred_by_email || ""} (${openRow.referred_by_code})`
                        : "Direct"}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Their referral code</div>
                    <div className="font-mono text-xs flex items-center gap-1.5">
                      {openRow.referral_code || "—"}
                      {openRow.referral_code && (
                        <button
                          type="button"
                          onClick={() => copyText(openRow.referral_code)}
                          className="hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-3">
                <div>
                  <Label htmlFor="d-name">Full name</Label>
                  <Input
                    id="d-name"
                    value={(draft.name as string) || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="First Last"
                  />
                </div>
                <div>
                  <Label htmlFor="d-bio">Bio</Label>
                  <Textarea
                    id="d-bio"
                    rows={4}
                    value={(draft.bio as string) || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                    placeholder="Short bio shown on the leaderboard…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["linkedin_url", "LinkedIn"],
                      ["website_url", "Website"],
                      ["facebook_url", "Facebook"],
                      ["instagram_url", "Instagram"],
                      ["youtube_url", "YouTube"],
                    ] as const
                  ).map(([k, label]) => (
                    <div key={k}>
                      <Label htmlFor={`d-${k}`} className="text-xs">
                        {label}
                      </Label>
                      <Input
                        id={`d-${k}`}
                        value={(draft[k as keyof BioRow] as string) || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                        placeholder="https://…"
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 pt-4 border-t">
                {openRow.waitlist_id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteOne(openRow)}
                    className="text-destructive hover:text-destructive gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete signup
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpenRow(null)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveDrawer} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminBios;
