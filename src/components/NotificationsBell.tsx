import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  className?: string;
}

const NotificationsBell = ({ className }: Props) => {
  const items = useNotifications();
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <Link
      to="/notifications"
      aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      title="Notifications"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] transition-colors hover:bg-[#F7F8FA]",
        className
      )}
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black leading-none text-primary-foreground ring-2 ring-background"
          aria-hidden
        >
          {badge}
        </span>
      )}
    </Link>
  );
};

export default NotificationsBell;
