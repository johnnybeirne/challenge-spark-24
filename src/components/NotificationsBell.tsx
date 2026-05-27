import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { markAllRead, markRead, clearNotifications } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useMemo } from "react";

interface Props {
  className?: string;
}

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

const NotificationsBell = ({ className }: Props) => {
  const items = useNotifications();
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted",
            className
          )}
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          title="Notifications"
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
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-bold">Notifications</p>
          {items.length > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Body = (
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-primary"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      {n.title && (
                        <p className="text-sm font-bold text-foreground">{n.title}</p>
                      )}
                      <p className="text-sm text-foreground">
                        {n.message}
                        {n.href && (
                          <>
                            {" "}
                            <span className="font-medium text-primary underline-offset-2 hover:underline">
                              {n.href === "/profile" ? "View Profile" : "View"}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelative(n.timestamp)}
                      </p>
                    </div>
                  </div>
                );
                const className = cn(
                  "block px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                  !n.read && "bg-primary/5"
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link to={n.href} className={className} onClick={() => markRead(n.id)}>
                        {Body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className={cn(className, "w-full")}
                      >
                        {Body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <div className="border-t border-border px-3 py-2 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="h-7 text-xs text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
