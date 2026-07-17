import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
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

const SIGNUP_TOAST_KEY = "challengeos_signup_toast_shown";

const AppShellInner = ({ showNav = false, fullWidth = false }: { showNav?: boolean; fullWidth?: boolean }) => {
  const { state, authUser } = useAppState();
  const { pathname } = useLocation();
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

  // ---------- LEADTREE 3-column shell (authenticated) ----------
  if (useLeadtreeShell) {
    return (
      <div data-experience={mode} className="min-h-screen bg-[#F7F8FA]">
        <TopNavigation />
        {!focusMode && <LeftSidebar />}
        {!focusMode && <RightSidebar />}

        <main
          className={[
            "leadtree-shell-main pt-[72px] pb-28 transition-[padding] duration-200",
            focusMode ? "" : leftCollapsed ? "lg:pl-[48px]" : "lg:pl-[280px]",
            focusMode ? "" : rightCollapsed ? "lg:pr-[48px]" : "lg:pr-[320px]",
          ].join(" ")}
        >
          <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-10">
            <BackButton />
            <Outlet />
          </div>
          <footer className="pb-8 text-center text-xs text-[#6B7280]">
            © {new Date().getFullYear()} LEADTREE. All rights reserved.
          </footer>
        </main>

        <ChallengeCountdownBar />
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
