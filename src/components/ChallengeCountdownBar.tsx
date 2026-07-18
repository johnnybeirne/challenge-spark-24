import { useEffect, useState, useRef, useCallback } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppContext";
import {
  getChallengeEndsAt,
  getRemainingMs,
  formatRemaining,
} from "@/lib/challengeWindow";

interface Props {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

const PILL_POSITION_KEY = "challenge_countdown_pill_position";
const PILL_CLOSED_KEY = "challenge_countdown_pill_closed";

const ChallengeCountdownBar = ({ className }: Props) => {
  const { state } = useAppState();
  const endsAt = getChallengeEndsAt(state.challenge?.startedAt, state.challenge?.endsAt);
  const [now, setNow] = useState(() => Date.now());
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isClosed, setIsClosed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  useEffect(() => {
    try {
      const savedPosition = window.localStorage.getItem(PILL_POSITION_KEY);
      if (savedPosition) setPosition(JSON.parse(savedPosition));
      const savedClosed = window.localStorage.getItem(PILL_CLOSED_KEY);
      if (savedClosed === "1") setIsClosed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-pill-close]")) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    },
    [position],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        setIsDragging(true);
      }
      setPosition({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) {
      try {
        window.localStorage.setItem(PILL_POSITION_KEY, JSON.stringify(position));
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
    setIsDragging(false);
  }, [position]);

  const handleClose = useCallback(() => {
    setIsClosed(true);
    try {
      window.localStorage.setItem(PILL_CLOSED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const remaining = getRemainingMs(endsAt, now);
  const expired = remaining <= 0;
  const { days, hours, minutes } = formatRemaining(remaining);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days === 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  if (isClosed) return null;

  return (
    <div
      className={cn(
        "relative inline-flex w-max items-center whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white/60 backdrop-blur-md px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] sm:px-[4%] sm:py-2.5 md:px-[5%] md:py-3",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none",
        userSelect: "none",
      }}
      role="status"
      aria-label="Challenge countdown"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <button
        type="button"
        data-pill-close
        onClick={handleClose}
        aria-label="Close countdown"
        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1F2937] text-white shadow-md transition-opacity hover:bg-[#374151] sm:h-6 sm:w-6"
      >
        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-8 sm:w-8">
        <Clock className="h-4 w-4" />
      </div>
      <div className="ml-2 sm:ml-3">
        <p className="whitespace-nowrap text-xs font-medium text-[#6B7280]">Time remaining</p>
        <p className={cn("whitespace-nowrap text-sm font-semibold tabular-nums", expired ? "text-destructive" : "text-[#1F2937]")}>
          {expired ? "Window ended" : `${parts.join(" ")} left`}
        </p>
      </div>
    </div>
  );
};

export default ChallengeCountdownBar;
