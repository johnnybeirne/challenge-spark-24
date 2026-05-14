import { Sparkles, ArrowUp, UserPlus, Send } from "lucide-react";

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

const ITEMS: ActivityItem[] = [
  { name: "Emma", action: "joined the waitlist", time: "12m ago", icon: <UserPlus className="h-3.5 w-3.5" />, avatar: avatarSarah },
  { name: "Patrick", action: "shared his invite link", time: "47m ago", icon: <Send className="h-3.5 w-3.5" />, avatar: avatarJames },
  { name: "Hiro", action: "invited 3 people", time: "2h ago", icon: <Send className="h-3.5 w-3.5" />, avatar: avatarAlex },
  { name: "Aoife", action: "unlocked bonus extras", time: "5h ago", icon: <Sparkles className="h-3.5 w-3.5" />, avatar: avatarLily },
  { name: "Sofia", action: "joined the waitlist", time: "9h ago", icon: <UserPlus className="h-3.5 w-3.5" />, avatar: avatarMaria },
  { name: "Liam", action: "shared his invite link", time: "1d ago", icon: <Send className="h-3.5 w-3.5" />, avatar: avatarOwen },
  { name: "Sarah", action: "invited 5 people", time: "2d ago", icon: <Send className="h-3.5 w-3.5" />, avatar: avatarTara },
  { name: "Michael", action: "unlocked bonus extras", time: "3d ago", icon: <Sparkles className="h-3.5 w-3.5" />, avatar: avatarJames },
  { name: "John", action: "joined the waitlist", time: "4d ago", icon: <UserPlus className="h-3.5 w-3.5" />, avatar: avatarOwen },
  { name: "Aoife", action: "invited 3 people", time: "5d ago", icon: <Send className="h-3.5 w-3.5" />, avatar: avatarLily },
  { name: "Hiro", action: "unlocked bonus extras", time: "1w ago", icon: <Sparkles className="h-3.5 w-3.5" />, avatar: avatarAlex },
  { name: "Patrick", action: "joined the waitlist", time: "2w ago", icon: <UserPlus className="h-3.5 w-3.5" />, avatar: avatarJames },
];

interface Props {
  title?: string;
  className?: string;
}

const WaitlistActivityFeed = ({ title, className = "" }: Props) => {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className={className}>
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      <div className="relative h-[156px] overflow-hidden rounded-lg">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-background to-transparent" />

        <div className="animate-scroll-up flex flex-col gap-2 hover:[animation-play-state:paused]">
          {doubled.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <img
                src={item.avatar}
                alt={item.name}
                loading="lazy"
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
              <p className="flex-1 text-sm text-foreground">
                <span className="font-medium">{item.name}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>
              </p>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaitlistActivityFeed;
