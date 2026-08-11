import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConsumerNav from "./ConsumerNav";
import PromoterNav from "./PromoterNav";

import AiCopilotChat from "./AiCopilotChat";
import TopNavigation from "./leadtree/TopNavigation";
import LeftSidebar from "./leadtree/LeftSidebar";
import RightSidebar from "./leadtree/RightSidebar";
import ChallengeCountdownBar from "./ChallengeCountdownBar";

import BackButton from "./BackButton";
import QaModePanel from "./QaModePanel";

import { useAppState } from "@/context/AppContext";
import { getExperience } from "@/lib/experience";
import { getExperienceFromPath } from "@/lib/experienceShell";
import { trackEvent } from "@/lib/analytics";
import { FocusModeProvider, useFocusMode } from "@/context/FocusModeContext";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useUserRole } from "@/hooks/useUserRole";
import { isPreviewHost } from "@/lib/utils";
import AccessGraceBanner from "./access/AccessGraceBanner";
import AccessLockedScreen from "./access/AccessLockedScreen";

const SIGNUP_TOAST_KEY = "challengeos_signup_toast_shown";

const AppShellInner = ({ showNav = false, fullWidth = false }: { showNav?: boolean; fullWidth?: boolean }) => {
  const { state, authUser } = useAppState();
  const { pathname, hash, key: locationKey } = useLocation();
  const mainScrollRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (hash) return;
    const el = mainScrollRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } catch {
      el.scrollTop = 0;
    }
  }, [locationKey, pathname, hash]);
  const isOwnerConsoleRoute = pathname === "/owner-console" || pathname.startsWith("/owner-console/") || pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthEntryRoute = pathname === "/challenge/join" || pathname === "/join" || pathname === "/blueprint/join" || pathname === "/blueprint-join" || pathname === "/waitlist" || pathname === "/waitlist/thanks";
  const { focusMode, leftCollapsed, rightCollapsed } = useFocusMode();
  const authenticated = !!authUser || !!state.user;
  const experience = getExperience(state.user?.role);
  const useLeadtreeShell = showNav && authenticated && experience !== "partner";
  const hideCopilotRoutes = ["/assess", "/assessment"];
  const showCopilotChat = authenticated && !isAuthEntryRoute && !isOwnerConsoleRoute && !hideCopilotRoutes.includes(pathname);
  const mode = getExperienceFromPath(pathname);

  const awardedActions = state.points?.awardedActions ?? [];
  const signupAwarded = awardedActions.includes("challenge_signup");
  const signupToastRef = useRef(false);
  useEffect(() => {
    if (!authenticated || !signupAwarded || signupToastRef.current) return;
    if (typeof window === "undefined") return;
    signupToastRef.current = true;

    let alreadyShown = false;
    try {
      alreadyShown = window.localStorage.getItem(SIGNUP_TOAST_KEY) === "1";
    } catch {
      /* ignore */
    }

    const isReturningWithProgress = awardedActions.length > 1;

    try {
      window.localStorage.setItem(SIGNUP_TOAST_KEY, "1");
    } catch {
      /* ignore */
    }

    if (alreadyShown || isReturningWithProgress) return;

    toast.success("🔥 +50 points earned — Challenge started!", {
      description: "Momentum is now live. Keep going on Day 1.",
      duration: 4500,
    });
    trackEvent("signup_completed");
  }, [authenticated, signupAwarded, awardedActions.length]);

  const access = useAccessStatus();
  const { isAdmin } = useUserRole();
  // Admin/owner users are exempt from the monthly-invite access gate entirely.
  const accessGateApplies = authenticated && !isOwnerConsoleRoute && !isAuthEntryRoute && pathname !== "/premium" && !isAdmin;
  const showLockedScreen = accessGateApplies && !access.loading && !access.hasAccess && !access.gracePeriod;
  const showGraceBanner = accessGateApplies && !access.loading && access.hasAccess && access.gracePeriod;
  const showSimulatorLaunch = pathname !== "/admin/simulator" && (isAdmin || isPreviewHost());

  if (showLockedScreen) {
    return <AccessLockedScreen pointsTotal={access.pointsTotal} pointsNeeded={access.pointsNeeded} onRefresh={() => void access.refresh()} />;
  }

  // ---------- LEADTREE 3-column shell (authenticated) ----------
  if (useLeadtreeShell) {
    // SHELL SCROLL RULE: three independent scroll regions (left sidebar, main, right sidebar)
    // inside a non-scrolling viewport-locked shell; each region contains its own scroll.
    // Do not add page-level scrolling here or in any child of these regions.
    return (
      <div data-experience={mode} className="h-screen overflow-hidden bg-[#F7F8FA]">
        <TopNavigation />
        <LeftSidebar />
        <RightSidebar />

        <main
          ref={mainScrollRef}
          style={{ height: "calc(100vh - var(--topbar-h))", marginTop: "var(--topbar-h)", overflowAnchor: "none" }}
          className={[
            "leadtree-shell-main overflow-y-auto overflow-x-hidden overscroll-contain transition-[padding] duration-[400ms] ease-in-out",
            focusMode || leftCollapsed ? "lg:pl-0" : "lg:pl-[260px]",
            focusMode || rightCollapsed ? "lg:pr-0" : "lg:pr-[360px]",
          ].join(" ")}
        >
          <div className="mx-auto w-full max-w-[1320px] px-8 py-12 pb-32 sm:px-12">
            {showGraceBanner && <AccessGraceBanner pointsNeeded={access.pointsNeeded} />}
            <BackButton />
            <Outlet />
          </div>
        </main>


        <div
          className={[
            "fixed bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none transition-[left,right] duration-[400ms] ease-in-out",
            focusMode ? "lg:left-0 lg:right-0" : leftCollapsed ? "lg:left-[48px] lg:right-[48px]" : "lg:left-[260px] lg:right-[360px]",
          ].join(" ")}
        >
          <ChallengeCountdownBar className="pointer-events-auto" />
        </div>
        {showCopilotChat && <AiCopilotChat />}
        <div className="lg:hidden">
          <ConsumerNav />
        </div>
        <QaModePanel />

      </div>
    );
  }

  // ---------- Fallback shell (public / landing / partner) ----------
  return (
    <div data-experience={mode} className="experience-root flex flex-col min-h-screen bg-background overflow-x-hidden">
      <div className={`w-full relative flex flex-col flex-1 min-h-0 ${showNav && authenticated ? "pb-24" : ""}`}>
        <div className="min-w-0 flex-1">
          {showGraceBanner && <AccessGraceBanner pointsNeeded={access.pointsNeeded} />}
          {showNav && authenticated && <BackButton />}
          <Outlet />
        </div>
        <footer className="py-6 text-center text-sm text-muted-foreground mb-16">
          © {new Date().getFullYear()} LeadTree. All rights reserved.
        </footer>
        {showNav && authenticated && (
          experience === "partner" ? <PromoterNav /> : <ConsumerNav />
        )}
      </div>
      {showCopilotChat && <AiCopilotChat />}
      <QaModePanel />
    </div>
  );
};

const AppShell = (props: { showNav?: boolean; fullWidth?: boolean }) => (
  <FocusModeProvider>
    <AppShellInner {...props} />
  </FocusModeProvider>
);

export default AppShell;
