import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import ConsumerNav from "./ConsumerNav";
import PromoterNav from "./PromoterNav";
import Footer from "./Footer";
import AiCopilotChat from "./AiCopilotChat";
import ChallengeSidebar from "./ChallengeSidebar";
import { useAppState } from "@/context/AppContext";
import { getExperience } from "@/lib/experience";

const AppShell = ({ showNav = false, fullWidth = false }: { showNav?: boolean; fullWidth?: boolean }) => {
  const { state } = useAppState();
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const authenticated = !!state.user;
  const experience = getExperience(state.user?.role);
  const showChallengeSidebar = showNav && authenticated && experience !== "partner";
  const hideCopilotRoutes = ["/assess"];
  const showCopilotChat = authenticated && !hideCopilotRoutes.includes(pathname);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showChallengeSidebar && <ChallengeSidebar onCollapsedChange={setSidebarCollapsed} />}
      <div className={`w-full relative transition-[padding] duration-300 ${showNav && authenticated && !showChallengeSidebar ? "pb-24" : ""} ${showChallengeSidebar ? (sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[260px]") : ""}`}>
        <Outlet />
        <Footer />
        {showNav && authenticated && !showChallengeSidebar && (
          experience === "partner" ? <PromoterNav /> : <ConsumerNav />
        )}
      </div>
      {showCopilotChat && <AiCopilotChat />}
    </div>
  );
};

export default AppShell;
