import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, GraduationCap, MessageCircle, Search, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import { useIsChallengerShell } from "@/hooks/useIsChallengerShell";
import NotificationsBell from "@/components/NotificationsBell";
import GlobalSearch from "@/components/GlobalSearch";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";
import sampleUserAvatar from "@/assets/sample-user-avatar.jpg";

// Global top utility bar — ecosystem tools, NOT progression.
// Rendered whenever the Challenger shell is active (real challengers
// AND admins previewing the challenger experience).
const TopBar = () => {
  const { pathname } = useLocation();
  const { state } = useAppState();
  const isChallengerShell = useIsChallengerShell();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!isChallengerShell) return null;


  const tools = [
    { to: "/training", label: "Training", Icon: GraduationCap },
    { to: "/community", label: "Community", Icon: Users },
    { to: "/calendar", label: "Events", Icon: CalendarDays },
    { to: "/mentor", label: "AI Coach", Icon: MessageCircle },
    { to: "/leaderboard", label: "Leaderboard", Icon: Trophy },
  ];

  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "";
  const hasAvatar = Boolean(state.user?.avatarUrl);
  const hasName = Boolean(firstName);
  const avatarSrc = state.user?.avatarUrl || (hasName ? avatarPlaceholder : sampleUserAvatar);

  return (
    <header className="sticky top-0 z-30 hidden h-14 w-full items-center justify-between gap-3 border-b border-border bg-background/80 px-3 backdrop-blur lg:flex">
      <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {tools.map(({ to, label, Icon }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Search"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <NotificationsBell />
        <Link
          to="/profile"
          aria-label="Profile"
          title="Profile"
          className="ml-1 block h-7 w-7 overflow-hidden rounded-full ring-1 ring-border transition hover:ring-primary/40"
        >
          <img
            src={avatarSrc}
            alt="Profile"
            onError={(e) => {
              if (e.currentTarget.src !== avatarPlaceholder) e.currentTarget.src = avatarPlaceholder;
            }}
            className="h-full w-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
