import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Pencil, User as UserIcon } from "lucide-react";
import Spinner from "@/components/Spinner";

interface ProfileRow {
  user_id: string;
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
}

const AdminBios = () => {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [draft, setDraft] = useState<Partial<ProfileRow>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, email, name, first_name, surname, bio, avatar_url, linkedin_url, facebook_url, instagram_url, youtube_url, website_url"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Could not load profiles");
    setRows((data as ProfileRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.name, r.first_name, r.surname, r.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [rows, q]);

  const openEdit = (r: ProfileRow) => {
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
    const { error } = await supabase
      .from("profiles")
      .update({
        bio: draft.bio ?? null,
        linkedin_url: draft.linkedin_url || null,
        facebook_url: draft.facebook_url || null,
        instagram_url: draft.instagram_url || null,
        youtube_url: draft.youtube_url || null,
        website_url: draft.website_url || null,
      })
      .eq("user_id", editing.user_id);
    setSaving(false);
    if (error) {
      toast.error("Could not save bio");
      return;
    }
    toast.success("Bio updated");
    setEditing(null);
    await load();
  };

  const displayName = (r: ProfileRow) =>
    r.name ||
    [r.first_name, r.surname].filter(Boolean).join(" ") ||
    r.email ||
    "Unnamed";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Bios</h1>
          <p className="text-sm text-muted-foreground">
            Edit any user's public bio and social links.
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

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No profiles</p>
            )}
            {filtered.map((r, i) => (
              <div
                key={r.user_id}
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
                  <p className="text-sm font-semibold truncate">{displayName(r)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.email || "—"}
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
