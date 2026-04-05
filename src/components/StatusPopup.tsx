import { useState, useEffect } from "react";
import avatarSarah from "@/assets/avatars/sarah.jpg";
import avatarJames from "@/assets/avatars/james.jpg";
import avatarMaria from "@/assets/avatars/maria.jpg";
import avatarAlex from "@/assets/avatars/alex.jpg";
import avatarTara from "@/assets/avatars/tara.jpg";
import avatarOwen from "@/assets/avatars/owen.jpg";
import avatarLily from "@/assets/avatars/lily.jpg";

interface StatusUpdate {
  name: string;
  action: string;
  avatar: string;
  timeAgo: string;
}

const UPDATES: StatusUpdate[] = [
  { name: "Sarah", action: "completed Day 1", avatar: avatarSarah, timeAgo: "Jan 12, 2026" },
  { name: "James", action: "launched his challenge", avatar: avatarJames, timeAgo: "Feb 3, 2026" },
  { name: "Maria", action: "invited 3 promoters", avatar: avatarMaria, timeAgo: "Feb 18, 2026" },
  { name: "Alex", action: "completed Day 2", avatar: avatarAlex, timeAgo: "Mar 5, 2026" },
  { name: "Tara", action: "completed Day 3", avatar: avatarTara, timeAgo: "Mar 21, 2026" },
  { name: "Owen", action: "launched his challenge", avatar: avatarOwen, timeAgo: "Mar 29, 2026" },
  { name: "Lily", action: "invited 5 builders", avatar: avatarLily, timeAgo: "Apr 4, 2026" },
];

const StatusPopup = () => {
  const [current, setCurrent] = useState<StatusUpdate | null>(null);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Show first one after 3s, then every 8s
    const initialDelay = setTimeout(() => {
      showNext(0);
    }, 3000);

    return () => clearTimeout(initialDelay);
  }, []);

  const showNext = (i: number) => {
    const update = UPDATES[i % UPDATES.length];
    setCurrent(update);
    setVisible(true);

    // Hide after 5s
    setTimeout(() => {
      setVisible(false);
    }, 5000);

    // Schedule next after 8s
    setTimeout(() => {
      showNext(i + 1);
    }, 8000);
  };

  if (!current) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ease-out ${
        visible
          ? "animate-fade-in"
          : "animate-fade-out pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shadow-lg max-w-[280px]">
        <img
          src={current.avatar}
          alt={current.name}
          className="h-8 w-8 rounded-full object-cover shrink-0"
        />
        <div>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{current.name}</span>{" "}
            <span className="text-muted-foreground">{current.action}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{current.timeAgo}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusPopup;
