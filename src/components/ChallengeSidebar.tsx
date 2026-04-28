import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronLeft, ChevronRight, Gift, Lock, Menu, Sparkles, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppState } from "@/context/AppContext";
import { getDayUnlock } from "@/lib/challengeProgression";
import { getCreditTier, getNextReward } from "@/lib/credits";
import { cn } from "@/lib/utils";

type ModalType = "day" | "community" | null;

const SidebarContent = ({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) => {
  const { state } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState<ModalType>(null);
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

  return (
    <aside className={cn("flex h-full w-full flex-col overflow-y-auto bg-card", collapsed ? "gap-3 p-3" : "gap-5 p-5")}>
      <button
        onClick={() => go("/user-dashboard")}
        className={cn(
          "rounded-2xl border border-border bg-background text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30",
          collapsed ? "p-3 text-center" : "p-4"
        )}
        title="Back to dashboard"
      >
        {collapsed ? (
          <p className="text-sm font-semibold text-foreground">D{currentDay}</p>
        ) : (
          <>
            <p className="font-semibold text-foreground">{hasSavedProgress ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}</p>
            <p className="mt-1 text-sm text-muted-foreground">Dashboard</p>
          </>
        )}
      </button>

      <button
        onClick={() => go("/unlocks")}
        className={cn(
          "rounded-2xl border border-primary/30 bg-primary/5 text-left shadow-sm transition-all hover:border-primary/60 hover:bg-primary/10",
          collapsed ? "p-3 text-center" : "p-4"
        )}
        title="Unlock Credits"
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-black">{credits}</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-primary">Unlock Credits</p>
                <p className="mt-1 text-4xl font-black leading-none text-foreground">{credits}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/25 bg-background px-2.5 py-1 text-xs font-bold text-primary">{creditTier.name}</span>
              {nextReward && <span className="text-xs text-muted-foreground">Next: {nextReward.credits} credits</span>}
            </div>
          </>
        )}
      </button>

      <section className="space-y-3">
        {!collapsed && <p className="text-sm font-semibold text-muted-foreground">Challenge progression</p>}
        {[1, 2, 3].map((day) => {
          const unlock = getDayUnlock(day, state.challenge.startedAt);
          const active = location.pathname === `/day/${day}`;
          return (
            <button
              key={day}
              onClick={() => (unlock.available ? go(`/day/${day}`) : setModal("day"))}
              className={cn(
                "w-full rounded-2xl border text-left transition-all",
                collapsed ? "p-3" : "p-4",
                unlock.available ? "border-primary/35 bg-background shadow-sm hover:border-primary" : "border-border bg-muted/40 opacity-60",
                active && "ring-2 ring-primary/20"
              )}
              title={`Day ${day}: ${unlock.label}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{collapsed ? day : `Day ${day}`}</p>
                {unlock.available ? <CheckCircle className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
              </div>
              {!collapsed && <p className="mt-2 text-sm text-muted-foreground">{unlock.label}</p>}
            </button>
          );
        })}
        <button
          onClick={() => go("/rewards")}
          className={cn(
            "w-full rounded-2xl border border-border bg-background text-left shadow-sm transition-all hover:border-primary/60 hover:bg-primary/5",
            collapsed ? "p-3" : "p-4"
          )}
          title="Bonus Vault"
        >
          <div className="flex items-center justify-between gap-3">
            {!collapsed && <p className="font-semibold text-foreground">Bonus Vault</p>}
            <Gift className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && <p className="mt-2 text-sm text-muted-foreground">Unlock powerful extras as you build</p>}
        </button>
      </section>

      <Card className={cn("border-border shadow-sm", communityUnlocked ? "bg-primary/5" : "bg-muted/40 opacity-80")} onClick={() => (communityUnlocked ? go("/community") : setModal("community"))}>
        <CardContent className={cn("cursor-pointer", collapsed ? "p-3" : "p-4")}>
          <div className="mb-2 flex items-center justify-between gap-3">
            {!collapsed && <p className="font-semibold text-foreground">Challenge Community</p>}
            {communityUnlocked ? <Users className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
          </div>
          {!collapsed && <><p className="text-sm text-muted-foreground">
            {communityUnlocked ? "Your private builder network is open." : "A private network for builders who have launched"}
          </p>
          {!communityUnlocked && <p className="mt-1 text-sm text-muted-foreground">Unlock after you complete the challenge and take action</p>}
          <div className="mt-4 space-y-2">
            {[
              ["Complete Day 3", day3Done],
              ["Submit your challenge", submitted],
              ["Invite 3 builders OR share", sharedOrInvited],
            ].map(([label, done]) => (
              <div key={String(label)} className="flex items-center gap-2 text-sm">
                {done ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div></>}
          {!collapsed && <Button className="mt-4 min-h-10 w-full whitespace-normal px-3 text-center text-sm leading-tight" variant={communityUnlocked ? "default" : "outline"} onClick={(e) => { e.stopPropagation(); if (communityUnlocked) go("/community"); else setModal("community"); }}>
            {communityUnlocked ? "Enter Community" : "Unlock Community"}
          </Button>}
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
      <div className={cn("fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-card transition-[width] duration-300 lg:block", collapsed ? "w-[84px]" : "w-[260px]") }>
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