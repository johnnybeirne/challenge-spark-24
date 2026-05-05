import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, CheckCircle, ChevronLeft, ChevronRight, Gift, Lock, Menu, Sparkles, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDayUnlock } from "@/lib/challengeProgression";
import { getCreditTier, getNextReward } from "@/lib/credits";
import { cn } from "@/lib/utils";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";

type ModalType = "day" | "community" | null;

const SidebarContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) => {
  const { state, setState, authUser } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<ModalType>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "there";
  const currentDay = state.challenge.currentDay || 1;
  const day3Done = state.challenge.completed || state.challenge.currentDay > 3;
  const submitted = !!state.challenge.launchUrl;
  const sharedOrInvited = state.network.direct >= 3;
  const communityUnlocked = day3Done && submitted && sharedOrInvited;
  const credits = state.credits?.total ?? 0;
  const creditTier = getCreditTier(credits);
  const nextReward = getNextReward(credits);
  const hasSavedProgress =
    state.challenge.currentDay > 1 ||
    state.challenge.completed ||
    Object.keys(state.challenge.tasks).length > 0 ||
    Object.keys(state.challenge.aiOutputs).some((key) => Boolean(state.challenge.aiOutputs[key])) ||
    state.unlocks.length > 0;

  const go = (path: string) => {
    onNavigate?.();
    navigate(path);
  };

  const handlePhotoUpload = async (file?: File) => {
    if (!file || !authUser || photoUploading) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Please choose an image under 5MB.");
    setPhotoUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${authUser.id}/profile-photo.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, {
      cacheControl: "3600", contentType: file.type, upsert: true,
    });
    if (uploadError) { setPhotoUploading(false); return toast.error(uploadError.message || "Photo upload failed"); }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("user_id", authUser.id);
    setPhotoUploading(false);
    if (profileError) return toast.error(profileError.message || "Could not save your photo");
    const alreadyUploaded = Boolean(state.user?.avatarUrl);
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, avatarUrl } } : prev));
    toast.success(alreadyUploaded ? "Photo updated." : "Photo added. +50 Unlock Credits earned.");
  };

  const avatarSrc = state.user?.avatarUrl || avatarPlaceholder;
  const hasAvatar = Boolean(state.user?.avatarUrl);

  return (
    <aside className={cn("flex h-full w-full flex-col overflow-y-auto bg-muted/60", collapsed ? "gap-2 p-2" : "gap-3 p-4")}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
      />
      <div
        className={cn(
          "rounded-xl border border-border bg-background transition-colors hover:border-primary/40",
          collapsed ? "p-2" : "px-3 py-2.5"
        )}
      >
        {collapsed ? (
          <button
            onClick={() => authUser ? photoInputRef.current?.click() : go("/user-dashboard")}
            className="relative mx-auto block h-9 w-9"
            title={hasAvatar ? "Change photo" : "Add your photo"}
            disabled={photoUploading}
          >
            <img src={avatarSrc} alt="Profile" onError={(e) => { if (e.currentTarget.src !== avatarPlaceholder) e.currentTarget.src = avatarPlaceholder; }} className={cn("h-9 w-9 rounded-full object-cover", !hasAvatar && "border-2 border-dashed border-primary/40")} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Camera className="h-2.5 w-2.5" />
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => authUser && photoInputRef.current?.click()}
              className="relative h-11 w-11 shrink-0"
              title={hasAvatar ? "Change photo" : "Add your photo"}
              disabled={photoUploading || !authUser}
            >
              <img
                src={avatarSrc}
                alt="Profile"
                onError={(e) => {
                  if (e.currentTarget.src !== avatarPlaceholder) e.currentTarget.src = avatarPlaceholder;
                }}
                className={cn(
                  "h-11 w-11 rounded-full object-cover transition-opacity hover:opacity-80",
                  !hasAvatar && "border-2 border-dashed border-primary/50"
                )}
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="h-3 w-3" />
              </span>
            </button>
            <button onClick={() => go("/user-dashboard")} className="min-w-0 flex-1 text-left" title="Back to dashboard">
              <p className="truncate text-sm font-semibold text-foreground">{hasSavedProgress ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}</p>
              <p className="truncate text-xs text-muted-foreground">
                {photoUploading ? "Uploading…" : hasAvatar ? "Dashboard" : "Tap photo to add yours"}
              </p>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => go("/unlocks")}
        className={cn(
          "rounded-xl border border-success/30 bg-success/10 text-left transition-all hover:border-success/60 hover:bg-success/15",
          collapsed ? "p-2 text-center" : "px-3 py-2.5"
        )}
        title="Unlock Credits"
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-0.5 text-success">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-black">{credits}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-success" />
                <p className="text-[11px] font-black uppercase tracking-wide text-success">Unlock Credits</p>
              </div>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">{creditTier.name}</span>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">You have</p>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              <p className="text-2xl font-black leading-none text-foreground">{credits}</p>
              {nextReward && <span className="text-[11px] text-muted-foreground">Next: {nextReward.credits}</span>}
            </div>
            <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">Earn by completing tasks. Spend on bonus unlocks.</p>
          </>
        )}
      </button>

      <section className="space-y-1.5">
        {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Challenge</p>}
        {[1, 2, 3].map((day) => {
          const unlock = getDayUnlock(day, state.challenge.startedAt);
          const active = location.pathname === `/day/${day}`;
          return (
            <button
              key={day}
              onClick={() => (unlock.available ? go(`/day/${day}`) : setModal("day"))}
              className={cn(
                "w-full rounded-xl border text-left transition-all",
                collapsed ? "p-2" : "px-3 py-2",
                unlock.available ? "border-primary/30 bg-background hover:border-primary" : "border-border bg-muted/40 opacity-60",
                active && "ring-2 ring-primary/20"
              )}
              title={`Day ${day}: ${unlock.label}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{collapsed ? day : `Day ${day}`}</p>
                  {!collapsed && <p className="truncate text-xs text-muted-foreground">{unlock.label}</p>}
                </div>
                {unlock.available ? <CheckCircle className="h-4 w-4 shrink-0 text-primary" /> : <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </div>
            </button>
          );
        })}
        <button
          onClick={() => go("/bonus-vault")}
          className={cn(
            "w-full rounded-xl border border-border bg-background text-left transition-all hover:border-primary/60 hover:bg-primary/5",
            collapsed ? "p-2" : "px-3 py-2"
          )}
          title="Your Bonus Vault"
        >
          <div className="flex items-center justify-between gap-2">
            {!collapsed && <p className="text-sm font-semibold text-foreground">Your Bonus Vault</p>}
            <Gift className="h-4 w-4 text-primary" />
          </div>
        </button>
      </section>

      <Card className={cn("border-2 border-black", communityUnlocked ? "bg-primary/5" : "bg-orange-200/60 opacity-80")} onClick={() => (communityUnlocked ? go("/community") : setModal("community"))}>
        <CardContent className={cn("cursor-pointer", collapsed ? "p-2" : "px-3 py-2.5")}>
          <div className="flex items-center justify-between gap-2">
            {!collapsed && <p className="text-sm font-semibold text-foreground">Community</p>}
            {communityUnlocked ? <Users className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
          {!collapsed && (
            <>
              <p className="mt-1 text-xs text-black">
                {communityUnlocked ? "Network with other challenge builders." : "Network with other challenge builders."}
              </p>
              {communityUnlocked && (
                <Button
                  size="sm"
                  className="mt-2.5 h-8 w-full text-xs"
                  onClick={(e) => { e.stopPropagation(); go("/community"); }}
                >
                  Enter Community
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={modal === "day"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Almost there, {firstName}</DialogTitle>
            <DialogDescription>This unlocks automatically after your current day and time window.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">You can move faster by inviting others.</p>
          <DialogFooter><Button onClick={() => go("/referrals")}>Invite builders</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "community"} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You’re almost in, {firstName}</DialogTitle>
            <DialogDescription>You’ve built something real. One more step unlocks a network where builders promote each other.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => (communityUnlocked ? go("/community") : go("/referrals"))}>Unlock Builder Circle</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

const ChallengeSidebar = ({ onCollapsedChange }: { onCollapsedChange?: (collapsed: boolean) => void }) => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => {
    setCollapsed((value) => {
      onCollapsedChange?.(!value);
      return !value;
    });
  };
  return (
    <>
      <div className={cn("fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-muted/60 transition-[width] duration-300 lg:block", collapsed ? "w-[84px]" : "w-[260px]") }>
        <Button
          size="sm"
          variant="outline"
          className="absolute -right-4 top-4 z-50 h-8 w-8 rounded-full p-0 shadow-md"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand dashboard sidebar" : "Collapse dashboard sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <SidebarContent collapsed={collapsed} />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="fixed left-4 top-4 z-40 lg:hidden" aria-label="Open challenge menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <button className="absolute right-4 top-4 z-10 text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChallengeSidebar;