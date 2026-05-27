import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Link as LinkIcon, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { getSetup, SETUP_KEY } from "@/components/Day1Setup";
import { uploadProfilePhoto } from "@/lib/profilePhoto";
import { pushNotification } from "@/lib/notifications";
import { trackEvent } from "@/lib/analytics";
import RestartDay1Button from "@/components/RestartDay1Button";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";

type ProfileRow = {
  user_id: string;
  email?: string | null;
  name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
};

const splitName = (full?: string | null): { first: string; last: string } => {
  if (!full) return { first: "", last: "" };
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};

const Profile = () => {
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarSigned, setAvatarSigned] = useState<string | null>(null);

  // Editable foundation answers
  const setup = getSetup();
  const [problem, setProblem] = useState(setup?.problem ?? "");
  const [audience, setAudience] = useState(setup?.audience ?? "");
  const [how, setHow] = useState(setup?.how ?? "");

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancel) return;
      if (error) {
        toast.error(error.message);
      }
      const row = (data as ProfileRow) ?? { user_id: uid };
      const fallback = splitName(row.name);
      setProfile(row);
      setFirstName(row.first_name ?? fallback.first);
      setSurname(row.surname ?? fallback.last);
      setEmail(row.email ?? authData.user?.email ?? "");
      setLinkedin(row.linkedin_url ?? "");
      setFacebook(row.facebook_url ?? "");
      setInstagram(row.instagram_url ?? "");
      setYoutube(row.youtube_url ?? "");
      setWebsite(row.website_url ?? "");
      setAvatarUrl(row.avatar_url ?? null);
      if (row.avatar_url) {
        const { data: signed } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(row.avatar_url, 60 * 60);
        if (!cancel) setAvatarSigned(signed?.signedUrl ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const aiOutputs = state.challenge?.aiOutputs ?? {};
  const aiCards = useMemo(() => {
    const cards: { label: string; value: string }[] = [];
    const map: Record<string, string> = {
      day1_promise: "Challenge promise",
      day1_transformation: "Challenge transformation",
      day1_quick_win: "Quick win idea",
      day1_outcome: "Challenge taker outcome",
      day1_title: "Suggested challenge title",
      day1_structure: "Suggested structure",
    };
    for (const [k, label] of Object.entries(map)) {
      const v = aiOutputs[k];
      if (v && typeof v === "string") cards.push({ label, value: v });
    }
    const builderKeys = Object.keys(aiOutputs)
      .filter((k) => k.startsWith("day1_builder_"))
      .sort();
    builderKeys.forEach((k, i) => {
      const v = aiOutputs[k];
      if (v && typeof v === "string") {
        cards.push({ label: `AI Coach note ${i + 1}`, value: v });
      }
    });
    return cards;
  }, [aiOutputs]);

  const handlePhoto = async (file?: File) => {
    if (!file || !profile?.user_id) return;
    setUploading(true);
    try {
      const { path, signedUrl, error } = await uploadProfilePhoto(profile.user_id, file);
      if (error) throw new Error(error.message ?? "Upload failed");
      if (path) {
        await supabase
          .from("profiles")
          .update({ avatar_url: path } as never)
          .eq("user_id", profile.user_id);

        setAvatarUrl(path);
        setAvatarSigned(signedUrl ?? null);
        toast.success("Photo updated");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.user_id) return;
    setSaving(true);
    try {
      const fullName = [firstName.trim(), surname.trim()].filter(Boolean).join(" ");
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim() || null,
          surname: surname.trim() || null,
          name: fullName || null,
          linkedin_url: linkedin.trim() || null,
          facebook_url: facebook.trim() || null,
          instagram_url: instagram.trim() || null,
          youtube_url: youtube.trim() || null,
          website_url: website.trim() || null,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      // Update locally-saved challenge foundation answers too.
      try {
        const cur = JSON.parse(localStorage.getItem(SETUP_KEY) || "{}");
        localStorage.setItem(
          SETUP_KEY,
          JSON.stringify({
            ...cur,
            problem: problem.trim(),
            audience: audience.trim(),
            how: how.trim(),
          }),
        );
      } catch {}

      pushNotification({
        title: "Profile updated",
        message: "We've updated your profile with your challenge answers.",
        href: "/profile",
        dedupeKey: "profile_saved",
      });
      trackEvent("profile_updated", {});
      toast.success("Profile saved");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page-container py-12 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-page-container py-12 text-center text-sm text-muted-foreground">
        Sign in to view your profile.
      </div>
    );
  }

  const avatarSrc = avatarSigned || avatarPlaceholder;

  return (
    <div className="app-page-container py-6 md:py-10">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Profile</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            The source of truth for your challenge answers, AI-generated direction and how others find you.
          </p>
        </header>

        {/* Basic details */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold">Basic details</h2>
          <div className="flex items-center gap-4">
            <img
              src={avatarSrc}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover ring-1 ring-border"
              onError={(e) => {
                if (e.currentTarget.src !== avatarPlaceholder) e.currentTarget.src = avatarPlaceholder;
              }}
            />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handlePhoto(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {avatarUrl ? "Replace photo" : "Add profile photo"}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">First name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Surname</label>
              <Input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Doe" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email</label>
              <Input value={email} disabled className="bg-muted/40" />
              <p className="text-xs text-muted-foreground">Email is managed via your login and can't be changed here.</p>
            </div>
          </div>
        </section>

        {/* Social links */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" /> Social & web
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "LinkedIn", value: linkedin, set: setLinkedin, ph: "https://linkedin.com/in/…" },
              { label: "Facebook", value: facebook, set: setFacebook, ph: "https://facebook.com/…" },
              { label: "Instagram", value: instagram, set: setInstagram, ph: "https://instagram.com/…" },
              { label: "YouTube", value: youtube, set: setYoutube, ph: "https://youtube.com/@…" },
              { label: "Website", value: website, set: setWebsite, ph: "https://…" },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{f.label}</label>
                <Input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
          </div>
        </section>

        {/* Challenge foundation */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Challenge Foundation</h2>
              <p className="text-sm text-muted-foreground">
                Your answers from the Day 1 assessment. These power the AI Coach.
              </p>
            </div>
            <RestartDay1Button variant="ghost" size="sm" className="shrink-0 text-xs text-muted-foreground" label="Restart Day 1" />
          </div>
          <div className="space-y-4">
            {[
              { label: "What problem do you solve?", value: problem, set: setProblem },
              { label: "Who do you solve it for?", value: audience, set: setAudience },
              { label: "How do you solve it?", value: how, set: setHow },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{f.label}</label>
                <Textarea
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Not answered yet."
                />
              </div>
            ))}
          </div>
        </section>

        {/* AI-generated direction */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold">AI-Generated Challenge Direction</h2>
            <p className="text-sm text-muted-foreground">Outputs from the AI Builder and AI Coach.</p>
          </div>
          {aiCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Finish Day 1 and chat with the AI Coach to populate this.
            </p>
          ) : (
            <div className="grid gap-3">
              {aiCards.map((c, i) => (
                <div key={`${c.label}-${i}`} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">{c.label}</p>
                  <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{c.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
