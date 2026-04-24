import { Outlet } from "react-router-dom";
import ConsumerNav from "./ConsumerNav";
import PromoterNav from "./PromoterNav";
import AiCopilotChat from "./AiCopilotChat";
import ChallengeSidebar from "./ChallengeSidebar";
import { useAppState } from "@/context/AppContext";
import { getExperience } from "@/lib/experience";

const AppShell = ({ showNav = false, fullWidth = false }: { showNav?: boolean; fullWidth?: boolean }) => {
  const { state } = useAppState();
  const authenticated = !!state.user;
  const experience = getExperience(state.user?.role);
  const showChallengeSidebar = showNav && authenticated && experience !== "partner";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showChallengeSidebar && <ChallengeSidebar />}
      <div className={`w-full relative ${fullWidth ? "" : "pb-20"} ${showChallengeSidebar ? "lg:pl-[260px]" : ""}`}>
        <Outlet />
        {showNav && authenticated && !showChallengeSidebar && (
          experience === "partner" ? <PromoterNav /> : <ConsumerNav />
        )}
      </div>
      {authenticated && <AiCopilotChat />}
    </div>
  );
};

export default AppShell;
