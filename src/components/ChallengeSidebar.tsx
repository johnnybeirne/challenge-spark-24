import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, Circle, Compass, Gift, HelpCircle, Lock, LogOut, Menu, MessageCircle, PlayCircle, Rocket, Settings, Share2, Sparkles, Target, TrendingUp, User as UserIcon, Users, Workflow, X, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadProfilePhoto } from "@/lib/profilePhoto";
import { useUserState } from "@/hooks/useUserState";
import { useUserRole } from "@/hooks/useUserRole";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";
import sampleUserAvatar from "@/assets/sample-user-avatar.jpg";
import ExperienceModeBadge from "@/components/ExperienceModeBadge";
import { useChallengeIdentity } from "@/hooks/useChallengeIdentity";

const SidebarContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) => {
  const { state, setState, authUser } = useAppState();
  const { hasJoinedChallenge, isPremiumUser } = useUserState();
  const { permissions, role } = useUserRole();
  const showChallengeNav =
    hasJoinedChallenge ||
    role === "challenger" ||
    role === "premium_user" ||
    role === "partner" ||
    role === "admin";
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

  const hasAvatar = Boolean(state.user?.avatarUrl);
  const hasName = Boolean(firstName);
  // Sample placeholders when the user hasn't added their photo/name yet.
  const avatarSrc = state.user?.avatarUrl || (hasName ? avatarPlaceholder : sampleUserAvatar);
  const displayName = hasName ? firstName : "Alex";


  // ────────────────────────────────────────────────────────────────────────
  // CHALLENGER-ONLY LAYOUT
  // Only `challenger` role gets the journey-style sidebar.
  // Free Student / Premium / Partner / Admin keep the existing layout below.
  // ────────────────────────────────────────────────────────────────────────
  if (role === "challenger") {
    const identity = useChallengeIdentity();
    const currentDay = state.challenge.currentDay ?? 1;
    const challengeCompleted = !!state.challenge.completed;
    const dashboardActive = location.pathname === "/challenger-dashboard";

    // Per-user personalised day dates derived from challenge.startedAt
    // (persisted in challenge_progress.started_at). If somehow missing,
    // fall back to today so the UI never shows "—".
    const startedAt = state.challenge.startedAt ? new Date(state.challenge.startedAt) : new Date();
    const formatDayDate = (offset: number) => {
      const d = new Date(startedAt);
      d.setDate(d.getDate() + offset);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    const days = [1, 2, 3].map((n) => {
      const path = `/challenge/day-${n}`;
      const active =
        location.pathname === path ||
        location.pathname === `/day/${n}` ||
        location.pathname === `/challenge/day/${n}`;
      const complete = challengeCompleted || currentDay > n;
      const inProgress = !complete && currentDay === n;
      const locked = !complete && !inProgress;
      const status = complete ? "Complete" : inProgress ? "In Progress" : "Locked";
      const dateLabel = formatDayDate(n - 1);
      return { n, path, active, complete, inProgress, locked, status, dateLabel };
    });

    const tools = [
      { path: "/referrals", label: "Invites", Icon: Share2 },
      { path: "/unlocks", label: "Rewards", Icon: Gift },
      { path: "/resources", label: "Resources", Icon: BookOpen },
    ];

    const bottom = [
      { path: "/challenger-dashboard", label: "Profile", Icon: UserIcon, onClick: () => authUser && photoInputRef.current?.click() },
      { path: "/challenger-dashboard", label: "Settings", Icon: Settings },
      { path: "/mentor", label: "Support", Icon: HelpCircle },
    ];

    return (
      <aside ref={asideRef} data-mode-aside className={cn("flex h-full w-full flex-col overflow-y-auto bg-muted/60", collapsed ? "gap-3 p-2" : "gap-4 p-4")}>
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

        {/* Brand */}
        {!collapsed ? (
          <button onClick={() => go("/challenger-dashboard")} className="px-1 text-left">
            <p className="text-xl font-black tracking-tight text-foreground">LEADIO</p>
            <p
              className="mt-1 truncate text-sm font-black uppercase tracking-[0.14em] text-primary"
              title={identity.title}
            >
              {identity.isPersonalised ? identity.shortTitle : "Challenger"}
            </p>
          </button>
        ) : (
          <p className="text-center text-base font-black tracking-tight text-foreground">L</p>
        )}

        {/* Dashboard */}
        <button
          onClick={() => go("/challenger-dashboard")}
          className={cn(
            "w-full rounded-xl border border-border bg-background text-left transition-all hover:bg-primary/5",
            collapsed ? "p-2" : "px-3 py-2.5",
            dashboardActive && "ring-2 ring-primary/20 border-primary/40"
          )}
          title="Dashboard"
        >
          <div className="flex items-center gap-2">
            <Compass className={cn("h-4 w-4 shrink-0", dashboardActive ? "text-primary" : "text-muted-foreground")} />
            {!collapsed && <span className="text-sm font-semibold text-foreground">Dashboard</span>}
          </div>
        </button>

        {/* DAYS — journey */}
        <section className="space-y-1.5">
          {!collapsed && (
            <p className="px-1 text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">Days</p>
          )}
          <div className="relative">
            {!collapsed && (
              <span className="pointer-events-none absolute left-[1.05rem] top-3 bottom-3 w-px bg-border" />
            )}
            <div className="space-y-1.5">
              {days.map(({ n, path, active, complete, inProgress, locked, status, dateLabel }) => {
                const Dot = complete ? CheckCircle2 : inProgress ? PlayCircle : locked ? Lock : Circle;
                return (
                  <button
                    key={path}
                    onClick={() => !locked && go(path)}
                    disabled={locked}
                    className={cn(
                      "relative w-full rounded-xl text-left transition-all",
                      collapsed ? "p-2" : "px-3 py-2.5",
                      locked ? "cursor-not-allowed opacity-60" : "hover:bg-primary/5",
                      active && "bg-background ring-2 ring-primary/20"
                    )}
                    title={`Day ${n} — ${dateLabel} — ${status}`}
                  >
                    <div className="flex items-center gap-3">
                      <Dot
                        className={cn(
                          "h-4 w-4 shrink-0 bg-muted/60 rounded-full",
                          complete && "text-success",
                          inProgress && "text-primary",
                          locked && "text-muted-foreground"
                        )}
                      />
                      {!collapsed && (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={cn("text-sm font-semibold", locked ? "text-muted-foreground" : "text-foreground")}>
                              Day {n}
                            </p>
                            <p className={cn("text-sm font-semibold tabular-nums", locked ? "text-muted-foreground" : "text-foreground/70")}>
                              {dateLabel}
                            </p>
                          </div>
                          <p className={cn(
                            "mt-0.5 text-sm font-semibold",
                            complete ? "text-success" : inProgress ? "text-primary" : "text-muted-foreground"
                          )}>
                            {status}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* TOOLS */}
        <section className="space-y-1.5">
          {!collapsed && (
            <p className="px-1 text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">Tools</p>
          )}
          {tools.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => go(path)}
                className={cn(
                  "w-full rounded-xl border border-border bg-background text-left transition-all hover:bg-primary/5",
                  collapsed ? "p-2" : "px-3 py-2",
                  active && "ring-2 ring-primary/20 border-primary/40"
                )}
                title={label}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && <span className="text-sm font-semibold text-foreground">{label}</span>}
                </div>
              </button>
            );
          })}
        </section>

        {/* Bottom: Profile / Settings / Support + Logout */}
        <div className="mt-auto space-y-1.5 pt-2">
          {bottom.map(({ path, label, Icon, onClick }) => (
            <button
              key={label}
              onClick={() => (onClick ? onClick() : go(path))}
              className={cn(
                "w-full rounded-xl text-left text-muted-foreground transition-all hover:bg-background hover:text-foreground",
                collapsed ? "p-2" : "px-3 py-2"
              )}
              title={label}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm font-semibold">{label}</span>}
              </div>
            </button>
          ))}
          <button
            onClick={async () => {
              await signOut();
              onNavigate?.();
              navigate("/");
              toast.success("Signed out");
            }}
            className={cn(
              "w-full rounded-xl text-left text-muted-foreground transition-all hover:bg-destructive/5 hover:text-destructive",
              collapsed ? "p-2" : "px-3 py-2"
            )}
            title="Log out"
          >
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm font-semibold">Log out</span>}
            </div>
          </button>
        </div>
      </aside>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Default layout (Free Student / Premium / Partner / Admin) — unchanged
  // ────────────────────────────────────────────────────────────────────────
  return (
    <aside ref={asideRef} data-mode-aside className={cn("flex h-full w-full flex-col overflow-y-auto bg-muted/60", collapsed ? "gap-2 p-2" : "gap-3 p-4")}>
      
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
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              onClick={() => authUser && photoInputRef.current?.click()}
              className="relative h-16 w-16 shrink-0"
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
                  "h-16 w-16 rounded-full object-cover transition-opacity hover:opacity-80",
                  !hasAvatar && "border-2 border-dashed border-primary/50"
                )}
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
            <button onClick={() => go("/challenger-dashboard")} className="w-full text-center" title="Back to dashboard">
              <p className="truncate text-lg font-bold text-foreground">
                {hasSavedProgress ? `Welcome back ${displayName}` : `Welcome ${displayName}`}
              </p>
              {photoUploading ? (
                <p className="truncate text-xs text-muted-foreground">Uploading…</p>
              ) : hasAvatar && hasName ? (
                <p className="truncate text-xs text-muted-foreground">Dashboard</p>
              ) : (
                <span className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-wider text-primary-foreground shadow-md">
                  👉 Start here
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <section className="space-y-1.5">
        
        {[
          { n: 1, label: "Foundations", Icon: Zap },
          { n: 2, label: "Build", Icon: Target },
          { n: 3, label: "Launch", Icon: Rocket },
        ].map(({ n, label, Icon }) => {
          const path = `/challenge/day-${n}`;
          const active = location.pathname === path || location.pathname === `/day/${n}` || location.pathname === `/challenge/day/${n}`;
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

      {(() => {
        // LMS "Learn" modules only appear for free_student. Challengers,
        // premium users, partners, and admins never see the course sidebar.
        if (role !== "free_student") return null;
        const learnActive = location.pathname.startsWith("/blueprint");
        return (
          <section className="space-y-1.5">
            {[
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
            })}
            <span className="sr-only">{learnActive ? "Learn active" : ""}</span>
          </section>
        );
      })()}

      <section className="space-y-1.5">
        {(showChallengeNav
          ? [
              { path: "/referrals", label: "Unlock Bonus Rewards", Icon: Share2, tint: "bg-emerald-100 text-emerald-700", accent: "hover:border-emerald-400" },
              { path: "/unlocks", label: "Rewards", Icon: Sparkles, tint: "bg-rose-100 text-rose-700", accent: "hover:border-rose-400" },
              { path: "/mentor", label: "Ask Johnny AI", Icon: MessageCircle, tint: "bg-violet-100 text-violet-700", accent: "hover:border-violet-400" },
              { path: "/calendar", label: "Live Sessions", Icon: CalendarDays, tint: "bg-amber-100 text-amber-700", accent: "hover:border-amber-400" },
            ]
          : [
              { path: "/mentor", label: "Ask Johnny AI", Icon: MessageCircle, tint: "bg-violet-100 text-violet-700", accent: "hover:border-violet-400" },
              { path: "/referrals", label: "Unlock Bonus Rewards", Icon: Share2, tint: "bg-emerald-100 text-emerald-700", accent: "hover:border-emerald-400" },
              { path: "/calendar", label: "Live Session Calendar", Icon: CalendarDays, tint: "bg-amber-100 text-amber-700", accent: "hover:border-amber-400" },
            ]
        ).map(({ path, label, Icon, tint, accent }) => {
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

      {role === "free_student" && permissions.showUpgradePrompts && (
        <section className="space-y-1.5">
          {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next Step</p>}
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
        </section>
      )}


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
        <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-3 py-2 backdrop-blur lg:hidden">
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Open challenge menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <p className="text-sm font-black tracking-tight text-foreground">LEADIO</p>
          <span className="h-9 w-9" aria-hidden />
        </div>
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