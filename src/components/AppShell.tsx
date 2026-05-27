import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ConsumerNav from "./ConsumerNav";
import PromoterNav from "./PromoterNav";
import Footer from "./Footer";
import AiCopilotChat from "./AiCopilotChat";
import ChallengeSidebar from "./ChallengeSidebar";
import TopBar from "./TopBar";
import RightRail from "./RightRail";
import BottomNav from "./BottomNav";
import BackButton from "./BackButton";
import { useAppState } from "@/context/AppContext";
import { getExperience } from "@/lib/experience";
import { getExperienceFromPath } from "@/lib/experienceShell";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsChallengerShell } from "@/hooks/useIsChallengerShell";
import { trackEvent } from "@/lib/analytics";

const SIGNUP_TOAST_KEY = "challengeos_signup_toast_shown";

const AppShell = ({ showNav = false, fullWidth = false }: { showNav?: boolean; fullWidth?: boolean }) => {
  const { state, authUser } = useAppState();
  const { pathname } = useLocation();
  const { role } = useUserRole();
  const isChallengerShell = useIsChallengerShell();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const authenticated = !!authUser || !!state.user;
  const experience = getExperience(state.user?.role);
  const showChallengeSidebar = showNav && authenticated && experience !== "partner";
  const showChallengerMobileNav = showChallengeSidebar && isChallengerShell;
  const hideCopilotRoutes = ["/assess", "/assessment"];
  const showCopilotChat = authenticated && !hideCopilotRoutes.includes(pathname);
  const mode = getExperienceFromPath(pathname);

  // Subtle confirmation for the +50 "challenge started" momentum reward.
  // The award itself is granted idempotently in applyCreditRules
  // (guarded by awardedActions). This effect only handles the visible
  // toast + analytics, persisted per-browser so it never repeats.
  const awardedActions = state.credits?.awardedActions ?? [];
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
      // ignore storage access errors (private mode, etc.)
    }

    // Suppress for returning users who already have additional awards —
    // they were granted the signup reward in a previous session.
    const isReturningWithProgress = awardedActions.length > 1;

    try {
      window.localStorage.setItem(SIGNUP_TOAST_KEY, "1");
    } catch {
      // ignore
    }

    if (alreadyShown || isReturningWithProgress) return;

    toast.success("🔥 +50 points earned — Challenge started!", {
      description: "Momentum is now live. Keep going on Day 1.",
      duration: 4500,
    });
    trackEvent("signup_completed");
  }, [authenticated, signupAwarded, awardedActions.length]);



  return (
    <div
      data-experience={mode}
      className="experience-root min-h-screen bg-background overflow-x-hidden"
    >
      {showChallengeSidebar && <ChallengeSidebar onCollapsedChange={setSidebarCollapsed} />}
      <div className={`w-full relative transition-[padding] duration-300 ${showNav && authenticated && !showChallengeSidebar ? "pb-24" : ""} ${showChallengerMobileNav ? "pb-20 lg:pb-0" : ""} ${showChallengeSidebar ? "pt-12 lg:pt-0" : ""} ${showChallengeSidebar ? (sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[260px]") : ""}`}>
        {showChallengeSidebar && <TopBar />}
        <div className={showChallengeSidebar ? "flex w-full" : undefined}>
          <div className="min-w-0 flex-1">
            {showNav && authenticated && <BackButton />}
            <Outlet />
            <Footer />
          </div>
          {showChallengeSidebar && <RightRail />}
        </div>
        {showNav && authenticated && !showChallengeSidebar && (
          experience === "partner" ? <PromoterNav /> : <ConsumerNav />
        )}
        {showChallengerMobileNav && <BottomNav />}
      </div>
      {showCopilotChat && <AiCopilotChat />}
    </div>
  );
};

export default AppShell;
