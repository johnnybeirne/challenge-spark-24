import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * ScoreRingCombined — one circular ring split into three equal-arc segments in
 * the app's System / Audience / Conversion brand colours, in fixed clockwise
 * order System -> Audience -> Conversion.
 *
 * Each segment gets a small pill label floating just outside its arc showing
 * the category name and its percentage. The centre shows the overall score, a
 * thin divider, and "OUT OF 100" in small-caps tracked style.
 *
 * Two modes:
 *  - animated (results page): the centre number counts up from 0 and the three
 *    arcs sweep in one after another. Users with prefers-reduced-motion get
 *    the final state instantly.
 *  - static (quiz landing hero): decorative sample numbers, no animation.
 */
export interface ScoreRingCombinedSegment {
  label: string;
  /** Category percentage, 0-100. */
  pct: number;
  color: string;
}

interface ScoreRingCombinedProps {
  /** Exactly three segments, in clockwise order starting at the top. */
  segments: [ScoreRingCombinedSegment, ScoreRingCombinedSegment, ScoreRingCombinedSegment];
  /** Overall score shown in the centre, 0-100. */
  overall: number;
  /** Sweep + count-up animation on mount. Defaults to false (static). */
  animated?: boolean;
  /** Extra centre content under "OUT OF 100" (e.g. the archetype pill on the
   *  results page). Archetypes are never passed in on the landing page. */
  centerExtra?: ReactNode;
  /** Maximum ring size in px on desktop. Defaults to 360. */
  maxSize?: number;
  ariaLabel?: string;
}

// Ring geometry (SVG viewBox 200x200, radius 80).
const R = 80;
const CIRCUMFERENCE = 2 * Math.PI * R;
const ARC_DEG = 110; // 110deg arc + 10deg gap per segment
const ARC_LEN = (ARC_DEG / 360) * CIRCUMFERENCE;
// Segment start angles (SVG degrees, 0 = 3 o'clock, clockwise from top area).
const SEGMENT_STARTS = [-85, 35, 155];
// Pill label positions (0deg = straight up, clockwise), radius as % of box.
const PILL_ANGLES = [-30, 90, 210];
const PILL_RADIUS = 56;

const ScoreRingCombined = ({
  segments,
  overall,
  animated = false,
  centerExtra,
  maxSize = 360,
  ariaLabel,
}: ScoreRingCombinedProps) => {
  const clampedOverall = Math.max(0, Math.min(100, Math.round(overall)));
  const [displayScore, setDisplayScore] = useState(animated ? 0 : clampedOverall);
  const [swept, setSwept] = useState(!animated);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!animated) {
      setDisplayScore(clampedOverall);
      setSwept(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayScore(clampedOverall);
      setSwept(true);
      return;
    }
    // Start the arc sweep on the next frame so the transition plays.
    const start = requestAnimationFrame(() => setSwept(true));
    const t0 = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(clampedOverall * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(start);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animated, clampedOverall]);

  return (
    <div
      className="relative mx-auto aspect-square w-full"
      style={{ maxWidth: `min(${maxSize}px, 88vw)` }}
      role={ariaLabel ? "meter" : undefined}
      aria-label={ariaLabel}
      aria-valuenow={clampedOverall}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Pill labels floating just outside each arc */}
      {segments.map((seg, i) => {
        const rad = (PILL_ANGLES[i] * Math.PI) / 180;
        return (
          <span
            key={seg.label}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground/70 shadow-sm ring-1 ring-border/40"
            style={{
              left: `${50 + PILL_RADIUS * Math.sin(rad)}%`,
              top: `${50 - PILL_RADIUS * Math.cos(rad)}%`,
            }}
          >
            {seg.label} {Math.round(seg.pct)}%
          </span>
        );
      })}

      <div className="absolute inset-[9%] rounded-full bg-muted/60 shadow-[0_18px_60px_-25px_hsl(var(--foreground)/0.25)]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {segments.map((seg, i) => (
            <circle
              key={seg.label}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${ARC_LEN} ${CIRCUMFERENCE - ARC_LEN}`}
              strokeDashoffset={swept ? 0 : ARC_LEN}
              transform={`rotate(${SEGMENT_STARTS[i]} 100 100)`}
              style={{
                transition: animated
                  ? `stroke-dashoffset 0.9s cubic-bezier(0.33, 1, 0.68, 1) ${i * 0.18}s`
                  : undefined,
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-[13%] flex flex-col items-center justify-center rounded-full bg-background text-center shadow-inner">
          <div className="text-6xl font-black leading-none text-foreground sm:text-7xl">
            {displayScore}
          </div>
          <div className="mt-3 h-px w-16 bg-border" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            out of 100
          </p>
          {centerExtra}
        </div>
      </div>
    </div>
  );
};

export default ScoreRingCombined;
