import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Focus,
  GraduationCap,
  Users,
  CalendarDays,
  Sparkles,
  Trophy,
  Search,
  Minimize2,
  User as UserIcon,
  Pencil,
  Bell,
  LogOut,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppState } from "@/context/AppContext";
import { useFocusMode } from "@/context/FocusModeContext";
import { useNavTips } from "@/hooks/useNavTips";
import { useAuth } from "@/hooks/useAuth";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";
import { getInitials } from "@/lib/formatName";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationsBell from "@/components/NotificationsBell";
import { toast } from "sonner";

const centerLinks = [
  { to: "/training",    label: "Training",    icon: GraduationCap, key: "top_training" },
  { to: "/community",   label: "Community",   icon: Users,         key: "top_community" },
  { to: "/calendar",    label: "Events",      icon: CalendarDays,  key: "top_events" },
  { to: "/mentor",      label: "LeadTree AI", icon: Sparkles,      key: "top_ai_coach" },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy,        key: "top_leaderboard" },
];

const TopNavigation = () => {
  const { state, authUser } = useAppState();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { byKey } = useNavTips();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const name = state.user?.name || "";
  const firstName = resolveFirstName({ stateUserName: name, authUser });
  const tip = (k: string) => applyTooltipTokens(byKey(k), firstName);
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const avatarUrl = state.user?.avatarUrl || null;
  const initials = getInitials(name) || "U";

  // Cmd/Ctrl + K opens the jump-to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


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
          {centerLinks.map(({ to, label, icon: Icon, key }) => {
            const isActive = pathname === to;
            return (
              <span key={to} className="inline-flex items-center">
                {withTip(
                  tip(key),
                  <NavLink
                    to={to}
                    data-tour={key}
                    className={[
                      "inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "font-semibold text-[#534AB7]"
                        : "font-normal text-[#6B7280] hover:text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    <span className="relative">
                      {label}
                      {isActive && (
                        <span className="absolute left-0 right-0 -bottom-2 h-[2px] bg-[#534AB7]" />
                      )}
                    </span>
                  </NavLink>,
                )}
              </span>
            );
          })}

        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            title="Search (Ctrl/Cmd + K)"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] hover:bg-[#F7F8FA]"
          >
            <Search className="h-4 w-4" />
          </button>
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <NotificationsBell className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] hover:bg-[#F7F8FA]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Profile and settings"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30 transition hover:ring-primary"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || "Your profile photo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-primary text-sm font-semibold text-white">
                    {initials}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/notifications")}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate("/");
                  toast.success("Signed out");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
