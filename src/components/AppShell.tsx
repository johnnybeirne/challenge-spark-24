import { Outlet } from "react-router-dom";
import ConsumerNav from "./ConsumerNav";
import PromoterNav from "./PromoterNav";
import AiCopilotChat from "./AiCopilotChat";
import { useAppState } from "@/context/AppContext";
import { getExperience } from "@/lib/experience";

const AppShell = ({ showNav = false, fullWidth = false }: { showNav?: boolean; fullWidth?: boolean }) => {
  const { state } = useAppState();
  const authenticated = !!state.user;
  const experience = getExperience(state.user?.role);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className={`w-full relative ${fullWidth ? "" : "pb-20"}`}>
        <Outlet />
        {showNav && authenticated && (
          experience === "partner" ? <PromoterNav /> : <ConsumerNav />
        )}
      </div>
      {authenticated && <AiCopilotChat />}
    </div>
  );
};

export default AppShell;
