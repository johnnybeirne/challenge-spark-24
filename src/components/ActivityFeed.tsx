import { useState, useEffect } from "react";
import { Zap, Rocket, Users, Heart } from "lucide-react";

interface ActivityItem {
  name: string;
  action: string;
  time: string;
  icon: React.ReactNode;
}

const ACTIVITIES: ActivityItem[] = [
  { name: "Sarah", action: "completed Day 1", time: "2m ago", icon: <Zap className="h-3.5 w-3.5" /> },
  { name: "James", action: "launched his app", time: "8m ago", icon: <Rocket className="h-3.5 w-3.5" /> },
  { name: "Maria", action: "invited 3 builders", time: "15m ago", icon: <Users className="h-3.5 w-3.5" /> },
  { name: "Alex", action: "supported another builder", time: "32m ago", icon: <Heart className="h-3.5 w-3.5" /> },
  { name: "Tara", action: "completed Day 3", time: "1h ago", icon: <Zap className="h-3.5 w-3.5" /> },
  { name: "Owen", action: "launched his app", time: "1h ago", icon: <Rocket className="h-3.5 w-3.5" /> },
  { name: "Lily", action: "invited 5 builders", time: "2h ago", icon: <Users className="h-3.5 w-3.5" /> },
];

function shuffleTime(): string {
  const mins = Math.floor(Math.random() * 55) + 1;
  return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
}

interface ActivityFeedProps {
  limit?: number;
  refresh?: boolean;
  title?: string;
}

const ActivityFeed = ({ limit = 4, refresh = false, title }: ActivityFeedProps) => {
  const [items, setItems] = useState<ActivityItem[]>(() => ACTIVITIES.slice(0, limit));

  useEffect(() => {
    if (!refresh) return;
    const id = setInterval(() => {
      setItems(
        [...ACTIVITIES]
          .sort(() => Math.random() - 0.5)
          .slice(0, limit)
          .map((item) => ({ ...item, time: shuffleTime() }))
      );
    }, 60_000);
    return () => clearInterval(id);
  }, [limit, refresh]);

  return (
    <div>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex items-center gap-3 rounded-lg bg-card border border-border px-3 py-2.5"
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
              {item.name[0]}
            </div>
            <p className="text-sm text-foreground flex-1">
              <span className="font-medium">{item.name}</span>{" "}
              <span className="text-muted-foreground">{item.action}</span>
            </p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
