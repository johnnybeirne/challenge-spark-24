import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import AiCopilotChat from "./AiCopilotChat";
import { useAppState } from "@/context/AppContext";

const AppShell = ({ showNav = false }: { showNav?: boolean }) => {
  const { state } = useAppState();
  const authenticated = !!state.user;

  return (
    <div className="min-h-screen flex justify-center bg-background overflow-x-hidden">
      <div className="w-full max-w-[480px] relative pb-20">
        <Outlet />
        {showNav && authenticated && <BottomNav />}
      </div>
      {authenticated && <AiCopilotChat />}
    </div>
  );
};

export default AppShell;
