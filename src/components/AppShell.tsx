import { Outlet } from "react-router-dom";
import ConsumerNav from "./ConsumerNav";
import PromoterNav from "./PromoterNav";
import AiCopilotChat from "./AiCopilotChat";
import { useAppState } from "@/context/AppContext";
import { getExperience } from "@/lib/experience";

const AppShell = ({ showNav = false }: { showNav?: boolean }) => {
  const { state } = useAppState();
  const authenticated = !!state.user;
  const experience = getExperience(state.user?.role);

  return (
    <div className="min-h-screen flex justify-center bg-background overflow-x-hidden">
      <div className="w-full max-w-[480px] relative pb-20">
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
