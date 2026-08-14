import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { markAllRead, markRead } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleString();
};

const Notifications = () => {
  const items = useNotifications();
  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [items]
  );
  const unread = sorted.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You are all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Bell className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {sorted.map((n) => {
            const body = (
              <div className="flex items-start gap-3 p-4">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-primary"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  {n.title && (
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatWhen(n.timestamp)}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id} className={cn(!n.read && "bg-muted/40")}>
                {n.href ? (
                  <Link to={n.href} onClick={() => markRead(n.id)} className="block hover:bg-muted/60">
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="block w-full text-left hover:bg-muted/60"
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
