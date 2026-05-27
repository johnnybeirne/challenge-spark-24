import { Link, useLocation } from "react-router-dom";
import { Bell, CalendarDays, MessageCircle, Sparkles, BookOpen, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import { useUserRole } from "@/hooks/useUserRole";

// Global top utility bar — ecosystem tools/shortcuts.
// Purely additive: does not change routes, auth, or business logic.
const TopBar = () => {
  const { pathname } = useLocation();
  const { state } = useAppState();
  const { role } = useUserRole();
  const isAdminLike = role === "admin" || role === "partner";

  const tools = [
    { to: "/mentor", label: "Ask Johnny AI", Icon: MessageCircle },
    { to: "/calendar", label: "Live", Icon: CalendarDays },
    { to: "/prompt-library", label: "Prompts", Icon: BookOpen },
    { to: "/bonus-vault", label: "Rewards", Icon: Sparkles },
  ];

  const points = state.credits?.total ?? 0;

  return (
    <header className="sticky top-0 z-30 hidden h-12 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:flex">
      <nav className="flex items-center gap-1">
        {tools.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted",
                active ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
        {points > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            {points} pts
          </span>
        )}
        {!isAdminLike && role !== "premium_user" && (
          <Link
            to="/premium"
            className="hidden items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90 md:inline-flex"
          >
            <Crown className="h-3 w-3" /> Upgrade
          </Link>
        )}
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Notifications"
          type="button"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
