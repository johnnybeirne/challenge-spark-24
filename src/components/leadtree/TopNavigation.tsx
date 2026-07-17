import { NavLink, Link } from "react-router-dom";
import {
  Focus,
  GraduationCap,
  Users,
  CalendarDays,
  Sparkles,
  Trophy,
  Search,
  Bell,
} from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

const centerLinks = [
  { to: "/challenger-dashboard", label: "Focus Mode", icon: Focus },
  { to: "/training", label: "Training", icon: GraduationCap },
  { to: "/community", label: "Community", icon: Users },
  { to: "/calendar", label: "Events", icon: CalendarDays },
  { to: "/mentor", label: "AI Coach", icon: Sparkles },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const TopNavigation = () => {
  const { state } = useAppState();
  const name = state.user?.name || "";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-[#E5E7EB] bg-white"
      role="banner"
    >
      <div className="mx-auto flex h-full items-center gap-8 px-6">
        <Link to="/challenger-dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-white">
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#1F2937]">
            LEADTREE
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
          {centerLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "relative inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "font-medium text-primary"
                    : "font-normal text-[#6B7280] hover:text-[#1F2937]",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-[10px] border-[#E5E7EB] text-[#6B7280]">
            QA Mode
          </Button>
          <button
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] hover:bg-[#F7F8FA]"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] hover:bg-[#F7F8FA]"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
          >
            {initial}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
