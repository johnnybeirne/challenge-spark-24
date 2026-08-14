import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Sparkles, Trophy, Copy } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { markAllRead, markRead } from "@/lib/notifications";
import { useAppState } from "@/context/AppContext";
import { getNextReward, pointRewards } from "@/lib/points";
import { getReferralUrl, cn } from "@/lib/utils";
import { ReferralLinkField } from "@/components/ReferralLinkField";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

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

const PointsReminder = () => {
  const { state } = useAppState();
  const [copied, setCopied] = useState(false);
  const points = state.points?.total ?? 0;
  const nextReward = getNextReward(points);
  const allUnlocked = !nextReward && pointRewards.length > 0;

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = getReferralUrl("/", inviteCode);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-background p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Your points</p>
            <p className="text-2xl font-bold leading-none text-foreground">
              {points}
              <span className="ml-1 text-sm font-medium text-muted-foreground">pts</span>
            </p>
          </div>
        </div>
        <div className="ml-auto min-w-0">
          {allUnlocked ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-600">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-semibold">All rewards unlocked</span>
            </div>
          ) : nextReward ? (
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {nextReward.points - points} points to go
              </p>
              <p className="text-xs text-muted-foreground">
                to reach {nextReward.title}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {referralLink && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Invite friends to earn more points
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ReferralLinkField url={referralLink} onCopied={() => setCopied(true)} />
            <Button
              size="sm"
              className="h-9 shrink-0 bg-primary font-semibold text-white hover:brightness-90 hover:text-white focus-visible:text-white"
              onClick={copyLink}
            >
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
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
      <PointsReminder />
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
