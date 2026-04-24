import { useState, useEffect } from "react";
import { Zap, Rocket, Users, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import avatarSarah from "@/assets/avatars/sarah.jpg";
import avatarJames from "@/assets/avatars/james.jpg";
import avatarMaria from "@/assets/avatars/maria.jpg";
import avatarAlex from "@/assets/avatars/alex.jpg";
import avatarTara from "@/assets/avatars/tara.jpg";
import avatarOwen from "@/assets/avatars/owen.jpg";
import avatarLily from "@/assets/avatars/lily.jpg";

interface ActivityItem {
  name: string;
  action: string;
  time: string;
  icon: React.ReactNode;
  avatar: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  zap: <Zap className="h-3.5 w-3.5" />,
  rocket: <Rocket className="h-3.5 w-3.5" />,
  users: <Users className="h-3.5 w-3.5" />,
  heart: <Heart className="h-3.5 w-3.5" />,
};

const AVATAR_MAP: Record<string, string> = {
  "/avatars/sarah.jpg": avatarSarah,
  "/avatars/james.jpg": avatarJames,
  "/avatars/maria.jpg": avatarMaria,
  "/avatars/alex.jpg": avatarAlex,
  "/avatars/tara.jpg": avatarTara,
  "/avatars/owen.jpg": avatarOwen,
  "/avatars/lily.jpg": avatarLily,
};

const FALLBACK_ACTIVITIES: ActivityItem[] = [
  { name: "Sarah", action: "completed Day 1", time: "2m ago", icon: <Zap className="h-3.5 w-3.5" />, avatar: avatarSarah },
  { name: "James", action: "launched his challenge", time: "8m ago", icon: <Rocket className="h-3.5 w-3.5" />, avatar: avatarJames },
  { name: "Maria", action: "invited 3 builders", time: "15m ago", icon: <Users className="h-3.5 w-3.5" />, avatar: avatarMaria },
  { name: "Alex", action: "supported another builder", time: "32m ago", icon: <Heart className="h-3.5 w-3.5" />, avatar: avatarAlex },
  { name: "Tara", action: "completed Day 3", time: "1h ago", icon: <Zap className="h-3.5 w-3.5" />, avatar: avatarTara },
  { name: "Owen", action: "launched his challenge", time: "1h ago", icon: <Rocket className="h-3.5 w-3.5" />, avatar: avatarOwen },
  { name: "Lily", action: "invited 5 builders", time: "2h ago", icon: <Users className="h-3.5 w-3.5" />, avatar: avatarLily },
  { name: "Noah", action: "completed Day 2", time: "3h ago", icon: <Zap className="h-3.5 w-3.5" />, avatar: avatarAlex },
  { name: "Emma", action: "got 4 new leads", time: "4h ago", icon: <Heart className="h-3.5 w-3.5" />, avatar: avatarSarah },
  { name: "Liam", action: "launched his challenge", time: "5h ago", icon: <Rocket className="h-3.5 w-3.5" />, avatar: avatarJames },
  { name: "Zara", action: "invited 8 builders", time: "6h ago", icon: <Users className="h-3.5 w-3.5" />, avatar: avatarMaria },
  { name: "Ben", action: "completed Day 3", time: "7h ago", icon: <Zap className="h-3.5 w-3.5" />, avatar: avatarOwen },
];

interface ActivityFeedProps {
  limit?: number;
  refresh?: boolean;
  title?: string;
}

const ActivityFeed = ({ title }: ActivityFeedProps) => {
  const [items, setItems] = useState<ActivityItem[]>(FALLBACK_ACTIVITIES);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("activity_feed_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        setItems(
          data.map((row) => ({
            name: row.name,
            action: row.action,
            time: row.time_label,
            icon: ICON_MAP[row.icon_type] || ICON_MAP.zap,
            avatar: AVATAR_MAP[row.avatar_url || ""] || avatarSarah,
          }))
        );
      }
    };
    load();
  }, []);

  const doubled = [...items, ...items];

  return (
    <div>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <div className="relative h-[156px] overflow-hidden rounded-lg">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 z-10 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-10 bg-gradient-to-t from-background to-transparent" />

        <div className="animate-scroll-up hover:[animation-play-state:paused] flex flex-col gap-2">
          {doubled.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="flex items-center gap-3 rounded-lg bg-card border border-border px-3 py-2.5 shrink-0"
            >
              <img
                src={item.avatar}
                alt={item.name}
                loading="lazy"
                className="h-7 w-7 rounded-full object-cover shrink-0"
              />
              <p className="text-sm text-foreground flex-1">
                <span className="font-medium">{item.name}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
