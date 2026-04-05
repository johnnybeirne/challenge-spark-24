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
}

const UPDATES: StatusUpdate[] = [
  { name: "Sarah", action: "completed Day 1", avatar: avatarSarah },
  { name: "James", action: "launched his challenge", avatar: avatarJames },
  { name: "Maria", action: "invited 3 promoters", avatar: avatarMaria },
  { name: "Alex", action: "completed Day 2", avatar: avatarAlex },
  { name: "Tara", action: "completed Day 3", avatar: avatarTara },
  { name: "Owen", action: "launched his challenge", avatar: avatarOwen },
  { name: "Lily", action: "invited 5 builders", avatar: avatarLily },
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

    // Hide after 4s
    setTimeout(() => {
      setVisible(false);
    }, 4000);

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
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shadow-lg max-w-[280px]">
        <img
          src={current.avatar}
          alt={current.name}
          className="h-8 w-8 rounded-full object-cover shrink-0"
        />
        <p className="text-sm text-foreground">
          <span className="font-semibold">{current.name}</span>{" "}
          <span className="text-muted-foreground">{current.action}</span>
        </p>
      </div>
    </div>
  );
};

export default StatusPopup;
