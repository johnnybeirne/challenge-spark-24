import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Flame, Gift, Sparkles } from "lucide-react";
import { useAppState } from "@/context/AppContext";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { state } = useAppState();

  // Dynamic challenge target so the "Challenge" tab always lands on
  // the user's current day, not Day 1.
  const currentDay = Math.min(Math.max(state.challenge?.currentDay ?? 1, 1), 3);
  const challengePath = `/challenge/day-${currentDay}`;

  const tabs = [
    { to: "/challenger-dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/challenger-dashboard"] },
    { to: challengePath, label: "Challenge", icon: Flame, match: ["/challenge/"] },
    { to: "/unlocks", label: "Unlocks", icon: Gift, match: ["/unlocks"] },
    { to: "/earn", label: "Earn Rewards", icon: Sparkles, match: ["/earn", "/referrals", "/rewards", "/bonus-vault"] },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
      aria-label="Primary"
    >
      <div className="flex justify-around pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
        {tabs.map(({ to, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname.startsWith(m));
          return (
            <Link
              key={label}
              to={to}
              className={`flex min-h-[52px] min-w-[60px] flex-col items-center justify-center gap-1 px-2 text-sm font-semibold leading-none transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
