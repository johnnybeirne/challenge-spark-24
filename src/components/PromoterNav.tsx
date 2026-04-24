import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, Globe } from "lucide-react";

const tabs = [
  { to: "/promoter", label: "Dashboard", icon: LayoutDashboard },
  { to: "/referrals", label: "Network", icon: Users },
  { to: "/partner/performance", label: "Performance", icon: BarChart3 },
  { to: "/community", label: "Community", icon: Globe },
];

const PromoterNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:w-[90vw] md:max-w-[1440px] bg-card border-t border-border z-50 safe-area-bottom md:rounded-t-xl md:border-x">
      <div className="flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/promoter" && pathname.startsWith(to));
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

export default PromoterNav;
