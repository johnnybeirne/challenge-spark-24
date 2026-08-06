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
  Minimize2,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppState } from "@/context/AppContext";
import { useFocusMode } from "@/context/FocusModeContext";
import { useNavTips } from "@/hooks/useNavTips";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";

const centerLinks = [
  { to: "/training",    label: "Training",    icon: GraduationCap, key: "top_training" },
  { to: "/community",   label: "Community",   icon: Users,         key: "top_community" },
  { to: "/calendar",    label: "Events",      icon: CalendarDays,  key: "top_events" },
  { to: "/mentor",      label: "AI Coach",    icon: Sparkles,      key: "top_ai_coach" },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy,        key: "top_leaderboard" },
];

const TopNavigation = () => {
  const { state, authUser } = useAppState();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { byKey } = useNavTips();
  const name = state.user?.name || "";
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  const firstName = resolveFirstName({ stateUserName: name, authUser });
  const tip = (k: string) => applyTooltipTokens(byKey(k), firstName);

  const withTip = (tip: string, children: React.ReactNode) => {
    if (!tip) return <>{children}</>;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-center">
          <p>{tip}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-[#E5E7EB] bg-white"
      role="banner"
    >
      <div className="mx-auto flex h-full items-center gap-8 px-6">
        <Link to="/challenger-dashboard" className="flex flex-col items-center gap-0.5">
          <span className="text-[8pt] leading-none text-[#6B7280]">Powered by</span>
          <img
            src="/leadtree-logo.png"
            alt="Brand logo"
            className="h-auto w-full max-w-[264px]"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
          {withTip(
            tip("focus_mode"),
            <button
              type="button"
              data-tour="focus_mode"
              onClick={toggleFocusMode}
              aria-pressed={focusMode}
              className={[
                "relative inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors",
                focusMode ? "bg-primary/10" : "bg-transparent hover:bg-primary/5",
              ].join(" ")}
            >
              {focusMode ? <Minimize2 className="h-5 w-5" strokeWidth={2} /> : <Focus className="h-5 w-5" strokeWidth={2} />}
              {focusMode ? "Exit Focus" : "Focus Mode"}
            </button>,
          )}
          {centerLinks.map(({ to, label, icon: Icon, key }) => (
            <span key={to} className="contents">
              {withTip(
                tip(key),
                <NavLink
                  to={to}
                  data-tour={key}
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
                </NavLink>,
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
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
