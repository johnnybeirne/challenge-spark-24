import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Search,
  Pencil,
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
  // Waitlist-only context
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

type SortKey =
  | "waitlist_position"
  | "first_name"
  | "surname"
  | "email"
  | "valid_referrals"
  | "referred_by_name"
  | "referred_by_email"
  | "current_tier"
  | "status"
  | "created_at";

type SortDir = "asc" | "desc";

const pick = <T,>(a: T | null | undefined, b: T | null | undefined): T | null =>
  (a ?? null) || (b ?? null) || null;

const earlier = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

const AdminBios = () => {
  const [rows, setRows] = useState<BioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [firstNameQ, setFirstNameQ] = useState("");
  const [surnameQ, setSurnameQ] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("valid_referrals");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<
    "all" | "referred" | "direct" | "active_inviters" | "flagged"
  >("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<BioRow | null>(null);
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

    setRows(Array.from(map.values()));
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Valid referrals per inviter waitlist_id (deduped by email, excludes self-ref).
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

  const topFiveKeys = useMemo(() => {
    return Array.from(validRefMap.entries())
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }, [validRefMap]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fn = firstNameQ.trim().toLowerCase();
    const sn = surnameQ.trim().toLowerCase();
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
      if (fn && !String(r.first_name || "").toLowerCase().includes(fn)) return false;
      if (sn && !String(r.surname || "").toLowerCase().includes(sn)) return false;
      if (fromT || toT) {
        const t = r.created_at ? new Date(r.created_at).getTime() : 0;
        if (fromT && t < fromT) return false;
        if (toT && t >= toT) return false;
      }
      if (filter === "referred" && !r.referred_by_code) return false;
      if (filter === "direct" && r.referred_by_code) return false;
      if (filter === "active_inviters" && (r.confirmed_invites ?? 0) <= 0) return false;
      if (filter === "flagged" && !r.suspected_self_referral) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const numericKeys: SortKey[] = ["waitlist_position", "valid_referrals"];
    out.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "created_at") {
        av = a.created_at ? new Date(a.created_at).getTime() : 0;
        bv = b.created_at ? new Date(b.created_at).getTime() : 0;
      } else if (sortKey === "valid_referrals") {
        av = validRefMap.get(a.key) ?? 0;
        bv = validRefMap.get(b.key) ?? 0;
      } else if (numericKeys.includes(sortKey)) {
        av = ((a as any)[sortKey] ?? Number.POSITIVE_INFINITY) as number;
        bv = ((b as any)[sortKey] ?? Number.POSITIVE_INFINITY) as number;
      } else {
        av = String((a as any)[sortKey] || "").toLowerCase();
        bv = String((b as any)[sortKey] || "").toLowerCase();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return out;
  }, [rows, q, firstNameQ, surnameQ, joinedFrom, joinedTo, sortKey, sortDir, filter, validRefMap]);

  const totals = useMemo(() => {
    const total = rows.length;
    const referred = rows.filter((r) => !!r.referred_by_code).length;
    const inviters = rows.filter((r) => (r.confirmed_invites ?? 0) > 0).length;
    const totalInvites = rows.reduce((sum, r) => sum + (r.confirmed_invites ?? 0), 0);
    const flagged = rows.filter((r) => r.suspected_self_referral).length;
    return { total, referred, inviters, totalInvites, flagged };
  }, [rows]);

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

  const saveNames = async (r: BioRow, newFirst: string, newSurname: string) => {
    const combined = [newFirst, newSurname].filter(Boolean).join(" ").trim();
    const payload = {
      first_name: newFirst || null,
      surname: newSurname || null,
      name: combined || null,
    };
    const ops: Promise<{ error: unknown }>[] = [];
    if (r.profile_user_id) {
      ops.push(
        supabase.from("profiles").update(payload).eq("user_id", r.profile_user_id) as unknown as Promise<{ error: unknown }>
      );
    }
    if (r.waitlist_id) {
      ops.push(
        supabase.from("waitlist_signups").update(payload).eq("id", r.waitlist_id) as unknown as Promise<{ error: unknown }>
      );
    }
    const results = await Promise.all(ops);
    if (results.some((x) => x.error)) {
      toast.error("Failed to update name");
      return;
    }
    setRows((prev) =>
      prev.map((x) =>
        x.key === r.key
          ? { ...x, first_name: newFirst || null, surname: newSurname || null, name: combined || null }
          : x
      )
    );
    toast.success("Name updated.");
  };

  const openEdit = (r: BioRow) => {
    setEditing(r);
    setDraft({
      bio: r.bio || "",
      linkedin_url: r.linkedin_url || "",
      facebook_url: r.facebook_url || "",
      instagram_url: r.instagram_url || "",
      youtube_url: r.youtube_url || "",
      website_url: r.website_url || "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      bio: (draft.bio as string) ?? null,
      linkedin_url: draft.linkedin_url || null,
      facebook_url: draft.facebook_url || null,
      instagram_url: draft.instagram_url || null,
      youtube_url: draft.youtube_url || null,
      website_url: draft.website_url || null,
    };
    const ops: Promise<{ error: unknown }>[] = [];
    if (editing.profile_user_id) {
      ops.push(
        supabase.from("profiles").update(payload).eq("user_id", editing.profile_user_id) as unknown as Promise<{ error: unknown }>
      );
    }
    if (editing.waitlist_id) {
      ops.push(
        supabase.from("waitlist_signups").update(payload).eq("id", editing.waitlist_id) as unknown as Promise<{ error: unknown }>
      );
    }
    const results = await Promise.all(ops);
    setSaving(false);
    if (results.some((x) => x.error)) {
      toast.error("Could not save bio");
      return;
    }
    toast.success("Bio updated");
    setEditing(null);
    await load();
  };

  const exportCsv = () => {
    const header = [
      "position",
      "first_name",
      "surname",
      "email",
      "valid_referrals",
      "referred_by_email",
      "tier",
      "status",
      "created_at",
      "source",
    ];
    const lines = filtered.map((r) =>
      [
        r.waitlist_position ?? "",
        JSON.stringify(r.first_name || ""),
        JSON.stringify(r.surname || ""),
        r.email || "",
        validRefMap.get(r.key) ?? 0,
        r.referred_by_email || r.referred_by_code || "",
        r.current_tier || "",
        r.status || "",
        r.created_at || "",
        r.sources.join("+"),
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

  const displayName = (r: BioRow) =>
    r.name ||
    [r.first_name, r.surname].filter(Boolean).join(" ") ||
    r.email ||
    "Unnamed";

  const SortHeader = ({
    k,
    label,
    align = "left",
  }: {
    k: SortKey;
    label: string;
    align?: "left" | "center" | "right";
  }) => {
    const active = sortKey === k;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th className={`px-3 py-2 text-${align} whitespace-nowrap`}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1 hover:text-foreground ${
            active ? "text-foreground" : ""
          }`}
        >
          {label}
          <Icon className="h-3 w-3 opacity-60" />
        </button>
      </th>
    );
  };

  const rankChipCls = [
    "bg-amber-400/20 text-amber-800 ring-amber-500/40",
    "bg-zinc-400/20 text-zinc-800 ring-zinc-500/40",
    "bg-orange-700/15 text-orange-900 ring-orange-700/40",
    "bg-amber-400/10 text-amber-800 ring-amber-400/30",
    "bg-amber-400/10 text-amber-800 ring-amber-400/30",
  ];

  return (
    <div className="p-6 w-[90%] mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">User Bios</h1>
          <p className="text-sm text-muted-foreground">
            Unified view of buyer profiles + waitlist signups. Records with the same email are merged.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, code…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
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
            <Trash2 className="h-4 w-4" /> Delete ({selected.size})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-5 mb-3">
        {[
          { label: "Total people", value: totals.total },
          { label: "Referred", value: totals.referred },
          { label: "Active inviters", value: totals.inviters },
          { label: "Total invites", value: totals.totalInvites },
          { label: "Flagged", value: totals.flagged },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(
          [
            ["all", "All"],
            ["referred", "Referred"],
            ["direct", "Direct"],
            ["active_inviters", "Inviters"],
            ["flagged", "⚠ Flagged"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
            {key === "flagged" && totals.flagged > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 text-[10px]">
                {totals.flagged}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
        <Input
          placeholder="Filter first name"
          value={firstNameQ}
          onChange={(e) => setFirstNameQ(e.target.value)}
        />
        <Input
          placeholder="Filter surname"
          value={surnameQ}
          onChange={(e) => setSurnameQ(e.target.value)}
        />
        <div>
          <Label className="text-xs text-muted-foreground">Joined from</Label>
          <Input type="date" value={joinedFrom} onChange={(e) => setJoinedFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Joined to</Label>
          <Input type="date" value={joinedTo} onChange={(e) => setJoinedTo(e.target.value)} />
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setQ("");
            setFirstNameQ("");
            setSurnameQ("");
            setJoinedFrom("");
            setJoinedTo("");
          }}
          className="self-end"
        >
          Clear filters
        </Button>
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {rows.length}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No people found</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 w-8">
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
                    <th className="px-3 py-2 text-left w-10"></th>
                    <SortHeader k="waitlist_position" label="#" />
                    <SortHeader k="first_name" label="First name" />
                    <SortHeader k="surname" label="Surname" />
                    <SortHeader k="email" label="Email" />
                    <SortHeader k="valid_referrals" label="Refs" align="right" />
                    <SortHeader k="referred_by_name" label="Referred by" />
                    <SortHeader k="referred_by_email" label="Referrer email" />
                    <SortHeader k="current_tier" label="Tier" />
                    <SortHeader k="status" label="Status" />
                    <th className="px-3 py-2 text-left">Flag</th>
                    <SortHeader k="created_at" label="Joined" />
                    <th className="px-3 py-2 text-left">Bio</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const refs = validRefMap.get(r.key) ?? 0;
                    const topRank = topFiveKeys.indexOf(r.key);
                    const isTop = topRank >= 0;
                    const rowCls = isTop
                      ? "border-b last:border-0 bg-amber-500/5 hover:bg-amber-500/10"
                      : "border-b last:border-0 hover:bg-muted/20";
                    const isBuyer = r.sources.includes("profile");
                    const isWaitlist = r.sources.includes("waitlist");
                    return (
                      <tr key={r.key} className={rowCls}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Select ${r.email}`}
                            checked={selected.has(r.key)}
                            onChange={() => toggleOne(r.key)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {isTop ? (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ${rankChipCls[topRank]}`}
                            >
                              {topRank + 1}
                            </span>
                          ) : (
                            r.waitlist_position ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2 min-w-[160px]">
                          <span className="inline-flex items-center gap-1.5 w-full">
                            {topRank === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            <Input
                              defaultValue={r.first_name || ""}
                              placeholder="First name"
                              className="h-8 px-2 py-1 border-transparent hover:border-input focus:border-input bg-transparent w-full"
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v === (r.first_name || "")) return;
                                saveNames(r, v, r.surname || "");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                if (e.key === "Escape") {
                                  (e.target as HTMLInputElement).value = r.first_name || "";
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                            />
                          </span>
                        </td>
                        <td className="px-3 py-2 min-w-[160px]">
                          <Input
                            defaultValue={r.surname || ""}
                            placeholder="Surname"
                            className="h-8 px-2 py-1 border-transparent hover:border-input focus:border-input bg-transparent w-full"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v === (r.surname || "")) return;
                              saveNames(r, r.first_name || "", v);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") {
                                (e.target as HTMLInputElement).value = r.surname || "";
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {r.email || "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          <span className={isTop ? "font-semibold text-amber-700" : refs > 0 ? "font-semibold" : ""}>
                            {refs || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.referred_by_code ? (
                            <span className="text-sm">
                              {r.referred_by_name || r.referred_by_email || r.referred_by_code}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {isWaitlist ? "Direct" : "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {r.referred_by_email ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="truncate max-w-[180px]">{r.referred_by_email}</span>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await navigator.clipboard.writeText(r.referred_by_email!);
                                    toast.success("Email copied");
                                  } catch {
                                    toast.error("Failed to copy");
                                  }
                                }}
                                className="rounded p-0.5 hover:bg-muted hover:text-foreground"
                                title="Copy email"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.current_tier ? (
                            <Badge variant="secondary" className="text-xs">
                              {r.current_tier}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.status ? (
                            <Badge variant={r.status === "active" ? "default" : "outline"} className="text-xs">
                              {r.status}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.suspected_self_referral ? (
                            <TooltipProvider>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/40">
                                      <AlertTriangle className="h-3 w-3" /> Flag
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <div className="mb-1 font-semibold">Suspected self-referral</div>
                                      <ul className="list-disc pl-4">
                                        {(r.self_referral_reasons || []).map((reason) => (
                                          <li key={reason}>{reason.replace(/_/g, " ")}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => clearFlag(r)}
                                      className="rounded p-1 text-emerald-700 hover:bg-emerald-500/10"
                                      aria-label="Mark valid"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Mark as valid</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => voidReferral(r)}
                                      className="rounded p-1 text-destructive hover:bg-destructive/10"
                                      aria-label="Void referral"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Void referral</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-3 py-2 max-w-xs">
                          <span className="line-clamp-1 text-muted-foreground">
                            {r.bio || <span className="italic">No bio</span>}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {isBuyer && (
                              <Badge variant="secondary" className="text-[10px] py-0 h-4">
                                Buyer
                              </Badge>
                            )}
                            {isWaitlist && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                Waitlist
                              </Badge>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openEdit(r)} className="ml-1">
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit bio — {displayName(editing)}</DialogTitle>
              </DialogHeader>
              {editing.profile_user_id && editing.waitlist_id && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Saves to both the buyer profile and waitlist record.
                </p>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={5}
                    value={(draft.bio as string) || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                    placeholder="Short bio shown on the leaderboard…"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={(draft.linkedin_url as string) || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/…"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={(draft.website_url as string) || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, website_url: e.target.value }))}
                      placeholder="https://…"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={(draft.facebook_url as string) || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, facebook_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={(draft.instagram_url as string) || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, instagram_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={(draft.youtube_url as string) || ""}
                      onChange={(e) => setDraft((d) => ({ ...d, youtube_url: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBios;
