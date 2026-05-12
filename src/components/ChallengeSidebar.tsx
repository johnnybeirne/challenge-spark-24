import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera, ChevronLeft, ChevronRight, Compass, Lock, LogOut, Menu, MessageCircle, Rocket, Sparkles, Target, Users, X, Zap } from "lucide-react";
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
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "there";
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
    <aside className={cn("flex h-full w-full flex-col overflow-y-auto bg-muted/60", collapsed ? "gap-2 p-2" : "gap-3 p-4")}>
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
              <span className="mt-1 inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Growth Partner
              </span>
            </button>
          </div>
        )}
      </div>

      <section className="space-y-1.5">
        {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Learn</p>}
        {[
          { n: 1, path: "/blueprint/lesson/1", label: "Foundations", Icon: Zap, locked: false },
          { n: 2, path: "/blueprint/lesson/2", label: "Growth Opportunity", Icon: Target, locked: false },
          { n: 3, path: "/blueprint/lesson/3", label: "Referral Loops", Icon: Users, locked: false },
          { n: 4, path: "/blueprint/lesson/4", label: "Advanced Systems", Icon: Lock, locked: true },
          { n: 5, path: "/blueprint/lesson/5", label: "Scaling With Leadio", Icon: Lock, locked: true },
        ].map(({ n, path, label, Icon, locked }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => go(path)}
              className={cn(
                "w-full rounded-xl border border-border bg-background text-left transition-all hover:border-primary/60 hover:bg-primary/5",
                collapsed ? "p-2" : "px-3 py-2",
                active && "ring-2 ring-primary/20"
              )}
              title={`${n}. ${label}`}
            >
              <div className="flex items-center justify-between gap-2">
                {!collapsed ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black",
                      active ? "bg-primary text-primary-foreground" : locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}>{n}</span>
                    <p className={cn("truncate text-sm font-semibold", locked ? "text-muted-foreground" : "text-foreground")}>{label}</p>
                  </div>
                ) : (
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black",
                    active ? "bg-primary text-primary-foreground" : locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}>{n}</span>
                )}
                <Icon className={cn("h-4 w-4 shrink-0", locked ? "text-primary/60" : "text-muted-foreground")} />
              </div>
            </button>
          );
        })}
      </section>

      <section className="space-y-1.5">
        {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tools</p>}
        {[
          { path: "/blueprint/insight", label: "Build Challenge Framework", Icon: Compass },
          { path: "/mentor", label: "Ask Johnny AI", Icon: MessageCircle },
        ].map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => go(path)}
              className={cn(
                "w-full rounded-xl border border-border bg-background text-left transition-all hover:border-primary/60 hover:bg-primary/5",
                collapsed ? "p-2" : "px-3 py-2",
                active && "ring-2 ring-primary/20"
              )}
              title={label}
            >
              <div className="flex items-center justify-between gap-2">
                {!collapsed && <p className="text-sm font-semibold text-foreground">{label}</p>}
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </section>

      <section className="space-y-1.5">
        {!collapsed && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next Step</p>}
        {hasJoinedChallenge ? (
          <button
            onClick={() => go("/user-dashboard")}
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
              "w-full rounded-xl border border-primary/40 bg-primary/5 text-left transition-all hover:border-primary hover:bg-primary/10",
              collapsed ? "p-2" : "px-3 py-2.5"
            )}
            title="Start the 3-Day Challenge — Free"
          >
            <div className="flex items-center justify-between gap-2">
              {!collapsed && (
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase leading-none tracking-wider text-white">Free</span>
                  <p className="mt-1 text-sm font-black text-primary">Start the 3-Day Challenge</p>
                </div>
              )}
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            </div>
          </button>
        )}
        {!isPremiumUser && (
          <button
            onClick={() => go("/upgrade")}
            className={cn(
              "w-full rounded-xl border border-primary/40 bg-primary/5 text-left transition-all hover:border-primary hover:bg-primary/10",
              collapsed ? "p-2" : "px-3 py-2.5"
            )}
            title="Unlock Full Course"
          >
            <div className="flex items-center justify-between gap-2">
              {!collapsed && <p className="text-sm font-black text-primary">Unlock Full Course</p>}
              <Rocket className="h-4 w-4 shrink-0 text-primary" />
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