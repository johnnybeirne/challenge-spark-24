import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Flame, Gift, Users, Crown, Handshake } from "lucide-react";
import { useAppState } from "@/context/AppContext";

const baseTabs = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/day/1", label: "Challenge", icon: Flame },
  { to: "/unlocks", label: "Unlocks", icon: Gift },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/community", label: "Circle", icon: Crown },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-h-[44px] min-w-[44px] justify-center text-[10px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
