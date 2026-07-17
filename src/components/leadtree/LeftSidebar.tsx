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
} from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useFocusMode } from "@/context/FocusModeContext";
import ChallengeCountdown from "@/components/ChallengeCountdown";

const momentumLinks = [
  { to: "/earn", label: "Invites", icon: Users },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/resources", label: "Resources", icon: BookOpen },
];

const LeftSidebar = () => {
  const { state } = useAppState();
  const { pathname } = useLocation();
  const { leftCollapsed, toggleLeft } = useFocusMode();
  const currentDay = Math.min(Math.max(state.challenge?.currentDay ?? 1, 1), 3);

  const days = [1, 2, 3];
  const startedAt = state.challenge?.startedAt ? new Date(state.challenge.startedAt) : new Date();
  const dayDate = (d: number) => {
    const dt = new Date(startedAt);
    dt.setDate(dt.getDate() + (d - 1));
    return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  if (leftCollapsed) {
    return (
      <aside
        className="fixed left-0 top-[72px] bottom-0 z-30 hidden w-[48px] flex-col items-center border-r border-[#E5E7EB] bg-white py-4 lg:flex"
        aria-label="Sidebar (collapsed)"
      >
        <button
          type="button"
          onClick={toggleLeft}
          aria-label="Expand sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#6756F3] bg-[#6756F3] text-white shadow-sm hover:bg-[#5646d9]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="fixed left-0 top-[72px] bottom-0 z-30 hidden w-[280px] flex-col border-r border-[#E5E7EB] bg-white lg:flex"
      aria-label="Sidebar"
    >
      <button
        type="button"
        onClick={toggleLeft}
        aria-label="Collapse sidebar"
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#6756F3] bg-[#6756F3] text-white shadow-sm hover:bg-[#5646d9]"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6">
        {/* Countdown */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Challenge Countdown
          </p>
          <div className="rounded-[12px] bg-[#F7F8FA] px-4 py-3">
            <ChallengeCountdown compact />
          </div>
        </section>

        {/* Timeline */}
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Progress
          </p>
          <ol className="relative ml-3 border-l border-[#E5E7EB]">
            {days.map((d) => {
              const isDone = d < currentDay;
              const isCurrent = d === currentDay;
              const locked = d > currentDay;
              const to = `/challenge/day-${d}`;
              return (
                <li key={d} className="relative pl-6 pb-4 last:pb-0">
                  <span
                    className={[
                      "absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white",
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
                        ? "font-semibold text-[#1F2937]"
                        : locked
                          ? "text-[#6B7280]"
                          : "text-[#1F2937] hover:text-primary",
                    ].join(" ")}
                  >
                    Day {d}
                    <span className="mt-0.5 block text-[11px] font-normal text-[#6B7280]">
                      {dayDate(d)}
                    </span>
                  </Link>
                </li>
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
            {momentumLinks.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={[
                    "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-[#1F2937] hover:bg-[#F7F8FA]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </section>
      </div>

      {/* Pinned bottom */}
      <div className="border-t border-[#E5E7EB] px-3 py-3">
        <nav className="space-y-0.5">
          <Link to="/profile" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-[#1F2937] hover:bg-[#F7F8FA]">
            <Settings className="h-4 w-4" strokeWidth={1.75} /> Settings
          </Link>
          <a href="mailto:support@leadtree.io" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-[#1F2937] hover:bg-[#F7F8FA]">
            <LifeBuoy className="h-4 w-4" strokeWidth={1.75} /> Support
          </a>
          <Link to="/" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-[#1F2937] hover:bg-[#F7F8FA]">
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Logout
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default LeftSidebar;
