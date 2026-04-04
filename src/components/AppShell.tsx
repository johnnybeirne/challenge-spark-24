import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useAppState } from "@/context/AppContext";

const AppShell = ({ showNav = false }: { showNav?: boolean }) => {
  const { state } = useAppState();
  const authenticated = !!state.user;

  return (
    <div className="min-h-screen flex justify-center bg-background">
      <div className="w-full max-w-[480px] relative pb-16">
        <Outlet />
        {showNav && authenticated && <BottomNav />}
      </div>
    </div>
  );
};

export default AppShell;
