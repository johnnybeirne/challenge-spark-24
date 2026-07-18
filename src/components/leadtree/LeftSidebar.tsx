import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Users,
  Gift,
  BookOpen,
  Settings,
  LifeBuoy,
  LogOut,
  Check,
  Lock,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Rocket,
} from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useFocusMode } from "@/context/FocusModeContext";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useNavTips } from "@/hooks/useNavTips";
import { useNavTour } from "@/hooks/useNavTour";

const momentumLinks = [
  { to: "/earn",      label: "Invites",   icon: Users,    key: "nav_invites" },
  { to: "/rewards",   label: "Rewards",   icon: Gift,     key: "nav_rewards" },
  { to: "/resources", label: "Resources", icon: BookOpen, key: "nav_resources" },
];

const withTip = (tip: string, children: React.ReactNode) => {
  if (!tip) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-[240px]">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const LeftSidebar = () => {
  const { state } = useAppState();
  const { pathname } = useLocation();
  const { leftCollapsed, toggleLeft, focusMode } = useFocusMode();
  const { byKey } = useNavTips();
  const { start: startTour } = useNavTour();
  const currentDay = Math.min(Math.max(state.challenge?.currentDay ?? 1, 1), 3);

  const days = [1, 2, 3];
  const startedAt = state.challenge?.startedAt ? new Date(state.challenge.startedAt) : new Date();
  const dayDate = (d: number) => {
    const dt = new Date(startedAt);
    dt.setDate(dt.getDate() + (d - 1));
    return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  const width = leftCollapsed ? "w-[48px]" : "w-[260px]";
  const hidden = focusMode;

  if (leftCollapsed) {
    return (
      <aside
        className={[
          "fixed left-0 top-[72px] bottom-0 z-30 hidden lg:flex flex-col items-center border-r border-[#E5E7EB] bg-white py-4",
          width,
          "transition-[transform,opacity] duration-[400ms] ease-in-out",
          hidden ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
        ].join(" ")}
        aria-hidden={hidden}
        aria-label="Sidebar (collapsed)"
      >
        <button
          type="button"
          onClick={toggleLeft}
          aria-label="Expand sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6756F3] text-white shadow-sm hover:bg-[#5646d9]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  const dayTip = byKey("day_progress");

  return (
    <aside
      className={[
        "fixed left-0 top-[72px] bottom-0 z-30 hidden w-[260px] flex-col border-r border-[#E5E7EB] bg-white lg:flex",
        "transition-[transform,opacity] duration-[400ms] ease-in-out",
        hidden ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
      ].join(" ")}
      aria-hidden={hidden}
      aria-label="Sidebar"
    >
      <button
        type="button"
        onClick={toggleLeft}
        aria-label="Collapse sidebar"
        className="absolute -right-4 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#6756F3] text-white shadow-sm hover:bg-[#5646d9]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex-1 space-y-10 overflow-y-auto px-6 py-8">
        {/* Your Dashboard */}
        <nav>
          {withTip(
            byKey("nav_dashboard"),
            <NavLink
              to="/challenger-dashboard"
              data-tour="nav_dashboard"
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-[#1F2937] hover:bg-[#F7F8FA]",
                ].join(" ")
              }
            >
              <Rocket className="h-4 w-4" strokeWidth={1.75} />
              Your Dashboard
            </NavLink>,
          )}
        </nav>

        {/* Day Progress timeline */}
        <section data-tour="day_progress">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Day Progress
          </p>
          <ol className="relative ml-3 border-l border-[#E5E7EB]">
            {days.map((d) => {
              const isDone = d < currentDay;
              const isCurrent = d === currentDay;
              const locked = d > currentDay;
              const to = `/challenge/day-${d}`;
              const row = (
                <li
                  key={d}
                  className={[
                    "relative rounded-[10px] pb-2 pl-6 pt-1 last:pb-0",
                    isCurrent ? "bg-primary/10" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute -left-[5px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white",
                      isDone
                        ? "bg-[#10B981] text-white"
                        : isCurrent
                          ? "bg-primary text-white"
                          : "bg-[#E5E7EB] text-[#6B7280]",
                    ].join(" ")}
                  >
                    {isDone ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : locked ? <Lock className="h-2 w-2" /> : null}
                  </span>
                  <Link
                    to={locked ? "#" : to}
                    aria-disabled={locked}
                    className={[
                      "block text-sm leading-tight",
                      isCurrent
                        ? "font-semibold text-primary"
                        : locked
                          ? "text-[#6B7280]"
                          : "text-[#1F2937] hover:text-primary",
                    ].join(" ")}
                  >
                    <span className="block text-sm leading-tight">
                      Day {d} <span className="text-[#6B7280]">- {dayDate(d)}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] font-normal">
                      {isDone ? "Completed" : isCurrent ? "In Progress" : "Locked"}
                    </span>
                  </Link>
                </li>
              );
              if (!dayTip) return row;
              return (
                <Tooltip key={d}>
                  <TooltipTrigger asChild>{row}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px]">
                    <p>{dayTip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </ol>
        </section>

        {/* Build Momentum */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Build Momentum
          </p>
          <nav className="space-y-1">
            {momentumLinks.map(({ to, label, icon: Icon, key }) => {
              const active = pathname.startsWith(to);
              return (
                <span key={to} className="contents">
                  {withTip(
                    byKey(key),
                    <NavLink
                      to={to}
                      data-tour={key}
                      className={[
                        "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-[#1F2937] hover:bg-[#F7F8FA]",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {label}
                    </NavLink>,
                  )}
                </span>
              );
            })}
          </nav>
        </section>
      </div>

      {/* Pinned bottom */}
      <div className="border-t border-[#E5E7EB] px-4 py-4">
        <nav className="space-y-0.5">
          {withTip(
            byKey("nav_settings"),
            <Link to="/profile" data-tour="nav_settings" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-[#1F2937] hover:bg-[#F7F8FA]">
              <Settings className="h-4 w-4" strokeWidth={1.75} /> Settings
            </Link>,
          )}
          <button
            type="button"
            onClick={() => startTour()}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm text-[#1F2937] hover:bg-[#F7F8FA]"
          >
            <PlayCircle className="h-4 w-4" strokeWidth={1.75} /> Take the tour
          </button>
          {withTip(
            byKey("nav_support"),
            <a href="mailto:support@leadtree.io" data-tour="nav_support" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-[#1F2937] hover:bg-[#F7F8FA]">
              <LifeBuoy className="h-4 w-4" strokeWidth={1.75} /> Support
            </a>,
          )}
          {withTip(
            byKey("nav_logout"),
            <Link to="/" data-tour="nav_logout" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-[#1F2937] hover:bg-[#F7F8FA]">
              <LogOut className="h-4 w-4" strokeWidth={1.75} /> Logout
            </Link>,
          )}
        </nav>
      </div>
    </aside>
  );
};

export default LeftSidebar;
