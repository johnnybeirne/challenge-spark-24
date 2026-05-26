import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, Compass, Flag, Lock, LogOut, Menu, MessageCircle, Rocket, Share2, Sparkles, Target, TrendingUp, Users, Workflow, X, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadProfilePhoto } from "@/lib/profilePhoto";
import { useUserState } from "@/hooks/useUserState";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";

const SidebarContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) => {
  const { state, setState, authUser } = useAppState();
  const { hasJoinedChallenge, isPremiumUser } = useUserState();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const prevJoinedRef = useRef(hasJoinedChallenge);
  useEffect(() => {
    if (!prevJoinedRef.current && hasJoinedChallenge) {
      asideRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevJoinedRef.current = hasJoinedChallenge;
  }, [hasJoinedChallenge]);
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "";
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
    const { path, signedUrl, error: uploadError } = await uploadProfilePhoto(authUser.id, file);
    if (uploadError || !signedUrl) { setPhotoUploading(false); return toast.error(uploadError?.message || "Photo upload failed"); }
    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: path } as any).eq("user_id", authUser.id);
    setPhotoUploading(false);
    if (profileError) return toast.error(profileError.message || "Could not save your photo");
    const alreadyUploaded = Boolean(state.user?.avatarUrl);
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, avatarUrl: signedUrl } } : prev));
    toast.success(alreadyUploaded ? "Photo updated." : "Photo added. +50 Points earned.");
  };

  const avatarSrc = state.user?.avatarUrl || avatarPlaceholder;
  const hasAvatar = Boolean(state.user?.avatarUrl);

  return (
    <aside ref={asideRef} className={cn("flex h-full w-full flex-col overflow-y-auto bg-muted/60", collapsed ? "gap-2 p-2" : "gap-3 p-4")}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handlePhotoUpload(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      <div
        className={cn(
          "rounded-xl border border-border bg-background transition-colors hover:border-primary/40",
          collapsed ? "p-2" : "px-3 py-2.5"
        )}
      >
        {collapsed ? (
          <button
            onClick={() => authUser ? photoInputRef.current?.click() : go("/challenger-dashboard")}
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
            <button onClick={() => go("/challenger-dashboard")} className="min-w-0 flex-1 text-left" title="Back to dashboard">
              <p className="truncate text-sm font-semibold text-foreground">{hasSavedProgress ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}</p>
              <p className="truncate text-xs text-muted-foreground">
                {photoUploading ? "Uploading…" : hasAvatar ? "Dashboard" : "Tap photo to add yours"}
              </p>
            </button>
          </div>
        )}
      </div>

      {hasJoinedChallenge && (
        <section className="space-y-1.5">
          {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Challenge</p>}
          {[
            { n: 1, label: "Foundations", Icon: Zap },
            { n: 2, label: "Build", Icon: Target },
            { n: 3, label: "Launch", Icon: Rocket },
          ].map(({ n, label, Icon }) => {
            const path = `/day/${n}`;
            const active = location.pathname === path;
            const currentDay = state.challenge.currentDay ?? 1;
            const challengeCompleted = !!state.challenge.completed;
            const complete = challengeCompleted || currentDay > n;
            const locked = !complete && currentDay < n;
            const DisplayIcon = locked ? Lock : complete ? CheckCircle2 : Icon;
            return (
              <button
                key={path}
                onClick={() => go(path)}
                className={cn(
                  "w-full rounded-xl border-2 border-black text-left transition-all hover:bg-primary/5 bg-background",
                  locked && "border-border/60 bg-muted/30",
                  collapsed ? "p-2" : "px-3 py-2",
                  active && "ring-2 ring-primary/20"
                )}
                title={`Day ${n} – ${label}`}
              >
                <div className="flex items-center justify-between gap-2">
                  {!collapsed ? (
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[10px] font-black uppercase tracking-wider", locked ? "text-muted-foreground" : "text-primary")}>Day {n}</p>
                      <p className={cn("truncate text-sm font-semibold", locked ? "text-muted-foreground" : "text-foreground")}>{label}</p>
                    </div>
                  ) : (
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black",
                      active ? "bg-primary text-primary-foreground" : locked ? "bg-muted text-muted-foreground" : complete ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
                    )}>{n}</span>
                  )}
                  <DisplayIcon className={cn(
                    "h-4 w-4 shrink-0",
                    locked ? "text-muted-foreground" : complete ? "text-success" : active ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
              </button>
            );
          })}
        </section>
      )}

      {(() => {
        const midChallenge = hasJoinedChallenge && !state.challenge.completed;
        const learnActive = location.pathname.startsWith("/blueprint");
        return (
          <section className="space-y-1.5">
            
            {midChallenge ? (
              <button
                onClick={() => go("/blueprint/dashboard")}
                className={cn(
                  "w-full rounded-xl border text-left transition-all hover:border-primary/60 hover:bg-primary/5 border-border bg-background",
                  collapsed ? "p-2" : "px-3 py-2",
                  learnActive && "ring-2 ring-primary/20"
                )}
                title="Training"
              >
                <div className="flex items-center justify-between gap-2">
                  {!collapsed && <p className="text-sm font-semibold text-foreground">Training</p>}
                  <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ) : (
              [
                { n: 1, path: "/blueprint/lesson/1", label: "Foundations", Icon: Zap, premium: false },
                { n: 2, path: "/blueprint/lesson/2", label: "Growth Opportunity", Icon: Target, premium: false },
                { n: 3, path: "/blueprint/lesson/3", label: "Referral Loops", Icon: Users, premium: false },
                { n: 4, path: "/blueprint/lesson/4", label: "Advanced Systems", Icon: Workflow, premium: true },
                { n: 5, path: "/blueprint/lesson/5", label: "Scaling With Leadio", Icon: TrendingUp, premium: true },
              ].map(({ n, path, label, Icon, premium }) => {
                const active = location.pathname === path;
                const locked = premium && !isPremiumUser;
                const muted = !active && premium && isPremiumUser;
                const DisplayIcon = locked ? Lock : Icon;
                return (
                  <button
                    key={path}
                    onClick={() => go(path)}
                    className={cn(
                      "w-full rounded-xl border text-left transition-all hover:border-primary/60 hover:bg-primary/5 border-border bg-background",
                      muted && "border-border/60 bg-muted/30",
                      collapsed ? "p-2" : "px-3 py-2",
                      active && "ring-2 ring-primary/20"
                    )}
                    title={`Module ${n} – ${label}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {!collapsed ? (
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-[10px] font-black uppercase tracking-wider", locked ? "text-muted-foreground" : "text-primary")}>Module {n}</p>
                          <p className={cn("truncate text-sm font-semibold", locked ? "text-muted-foreground" : "text-foreground")}>{label}</p>
                        </div>
                      ) : (
                        <span className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black",
                          active ? "bg-primary text-primary-foreground" : locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        )}>{n}</span>
                      )}
                      <DisplayIcon className={cn(
                        "h-4 w-4 shrink-0",
                        locked ? "text-primary/60" : active ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  </button>
                );
              })
            )}
          </section>
        );
      })()}

      <section className="space-y-1.5">
        
        {[
          { path: "/blueprint/insight", label: "Build Challenge Framework", Icon: Compass, tint: "bg-indigo-100 text-indigo-700", accent: "hover:border-indigo-400" },
          { path: "/mentor", label: "Ask Johnny AI", Icon: MessageCircle, tint: "bg-violet-100 text-violet-700", accent: "hover:border-violet-400" },
          { path: "/referrals", label: "Referrals", Icon: Share2, tint: "bg-emerald-100 text-emerald-700", accent: "hover:border-emerald-400" },
          { path: "/calendar", label: "Live Session Calendar", Icon: CalendarDays, tint: "bg-amber-100 text-amber-700", accent: "hover:border-amber-400" },
        ].map(({ path, label, Icon, tint, accent }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => go(path)}
              className={cn(
                "w-full rounded-xl border border-border bg-background text-left transition-all hover:bg-primary/5",
                accent,
                collapsed ? "p-2" : "px-3 py-2",
                active && "ring-2 ring-primary/20"
              )}
              title={label}
            >
              <div className="flex items-center justify-between gap-2">
                {!collapsed && <p className="text-sm font-semibold text-foreground">{label}</p>}
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", tint)}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </button>
          );
        })}
      </section>


      <section className="space-y-1.5">
        {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next Step</p>}
        {hasJoinedChallenge ? (
          <button
            onClick={() => go("/challenger-dashboard")}
            className={cn(
              "w-full rounded-xl border border-primary/40 bg-primary/5 text-left transition-all hover:border-primary hover:bg-primary/10",
              collapsed ? "p-2" : "px-3 py-2.5"
            )}
            title="Continue Your Challenge"
          >
            <div className="flex items-center justify-between gap-2">
              {!collapsed && <p className="text-sm font-black text-primary">Continue Your Challenge</p>}
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            </div>
          </button>
        ) : (
          <button
            onClick={() => go("/blueprint/bridge")}
            className={cn(
              "relative w-full overflow-hidden rounded-xl border-2 border-emerald-500 bg-emerald-50 text-left shadow-sm transition-all hover:border-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20",
              collapsed ? "p-2" : "px-3 py-3"
            )}
            title="Start the 3-Day Challenge — 100% Free"
          >
            {!collapsed && (
              <span className="absolute -right-8 top-2 rotate-45 bg-emerald-500 px-8 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow">
                Free
              </span>
            )}
            <div className="flex items-center justify-between gap-2">
              {!collapsed ? (
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                    100% Free
                  </span>
                  <p className="mt-1.5 text-sm font-black text-emerald-700 dark:text-emerald-300">Start the 3-Day Challenge</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80">No credit card required</p>
                </div>
              ) : (
                <span className="mx-auto rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">Free</span>
              )}
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            </div>
          </button>
        )}
      </section>

      <button
        onClick={async () => {
          await signOut();
          onNavigate?.();
          navigate("/");
          toast.success("Signed out");
        }}
        className={cn(
          "mt-auto rounded-xl border border-border bg-background text-left transition-all hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive",
          collapsed ? "p-2" : "px-3 py-2"
        )}
        title="Log out"
      >
        <div className="flex items-center justify-between gap-2">
          {!collapsed && <span className="text-sm font-semibold">Log out</span>}
          <LogOut className="h-4 w-4 shrink-0" />
        </div>
      </button>

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