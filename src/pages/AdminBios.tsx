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
import { toast } from "sonner";
import { Search, Pencil, User as UserIcon, ArrowUpDown } from "lucide-react";
import Spinner from "@/components/Spinner";

type Source = "profile" | "waitlist";

interface BioRow {
  source: Source;
  id: string; // user_id for profile, waitlist id for waitlist
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
}

type SortKey = "first_name" | "surname" | "created_at";
type SortDir = "asc" | "desc";


const AdminBios = () => {
  const [rows, setRows] = useState<BioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [firstNameQ, setFirstNameQ] = useState("");
  const [surnameQ, setSurnameQ] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
        .limit(1000),
      supabase
        .from("waitlist_signups")
        .select(
          "id, email, name, first_name, surname, bio, avatar_url, linkedin_url, facebook_url, instagram_url, youtube_url, website_url, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (profilesRes.error) toast.error("Could not load profiles");
    if (waitlistRes.error) toast.error("Could not load waitlist");

    const profiles: BioRow[] = (profilesRes.data || []).map((p: any) => ({
      source: "profile",
      id: p.user_id,
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

    }));

    const profileEmails = new Set(
      profiles.map((p) => (p.email || "").toLowerCase()).filter(Boolean)
    );

    const waitlist: BioRow[] = (waitlistRes.data || [])
      .filter((w: any) => !profileEmails.has((w.email || "").toLowerCase()))
      .map((w: any) => ({
        source: "waitlist",
        id: w.id,
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
      }));


    setRows([...profiles, ...waitlist]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fn = firstNameQ.trim().toLowerCase();
    const sn = surnameQ.trim().toLowerCase();
    const fromT = joinedFrom ? new Date(joinedFrom).getTime() : null;
    const toT = joinedTo ? new Date(joinedTo).getTime() + 86_400_000 : null;
    const out = rows.filter((r) => {
      if (s && ![r.name, r.first_name, r.surname, r.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))) return false;
      if (fn && !String(r.first_name || "").toLowerCase().includes(fn)) return false;
      if (sn && !String(r.surname || "").toLowerCase().includes(sn)) return false;
      if (fromT || toT) {
        const t = r.created_at ? new Date(r.created_at).getTime() : 0;
        if (fromT && t < fromT) return false;
        if (toT && t >= toT) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      const av = sortKey === "created_at"
        ? (a.created_at ? new Date(a.created_at).getTime() : 0)
        : String((a as any)[sortKey] || "").toLowerCase();
      const bv = sortKey === "created_at"
        ? (b.created_at ? new Date(b.created_at).getTime() : 0)
        : String((b as any)[sortKey] || "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return out;
  }, [rows, q, firstNameQ, surnameQ, joinedFrom, joinedTo, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "created_at" ? "desc" : "asc"); }
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
    const { error } =
      editing.source === "profile"
        ? await supabase.from("profiles").update(payload).eq("user_id", editing.id)
        : await supabase.from("waitlist_signups").update(payload).eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save bio");
      return;
    }
    toast.success("Bio updated");
    setEditing(null);
    await load();
  };

  const displayName = (r: BioRow) =>
    r.name ||
    [r.first_name, r.surname].filter(Boolean).join(" ") ||
    r.email ||
    "Unnamed";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">User Bios</h1>
          <p className="text-sm text-muted-foreground">
            Edit any user or waitlist member's bio and social links.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
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
          onClick={() => { setQ(""); setFirstNameQ(""); setSurnameQ(""); setJoinedFrom(""); setJoinedTo(""); }}
          className="self-end"
        >
          Clear filters
        </Button>
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {rows.length}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort:</span>
          <Button size="sm" variant={sortKey === "first_name" ? "secondary" : "ghost"} onClick={() => toggleSort("first_name")}>
            First name <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
          <Button size="sm" variant={sortKey === "surname" ? "secondary" : "ghost"} onClick={() => toggleSort("surname")}>
            Surname <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
          <Button size="sm" variant={sortKey === "created_at" ? "secondary" : "ghost"} onClick={() => toggleSort("created_at")}>
            Joined <ArrowUpDown className="h-3 w-3 ml-1" />
          </Button>
          <span className="text-muted-foreground">({sortDir})</span>
        </div>
      </div>


      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No people found</p>
            )}
            {filtered.map((r, i) => (
              <div
                key={`${r.source}-${r.id}`}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < filtered.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0 overflow-hidden">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{displayName(r)}</p>
                    {r.source === "waitlist" && (
                      <Badge variant="outline" className="text-[10px] py-0 h-4">Waitlist</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.email || "—"}
                    {r.created_at && (
                      <span className="ml-2">· Joined {new Date(r.created_at).toLocaleDateString()}</span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {r.bio ? r.bio : <span className="italic">No bio yet</span>}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
              </div>
            ))}
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
