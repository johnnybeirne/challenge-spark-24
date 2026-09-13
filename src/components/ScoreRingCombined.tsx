import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * ScoreRingCombined — one circular ring split into three proportional-arc
 * segments in the app's System / Audience / Conversion brand colours, in fixed
 * clockwise order System -> Audience -> Conversion.
 *
 * Each segment's sweep angle is proportional to its percentage relative to the
 * sum of all three, so a category at 76% occupies a noticeably larger share of
 * the ring than one at 28%.
 *
 * Each segment gets a small pill label floating just outside its arc showing
 * only the category name (no number). The centre shows the overall score, a
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
  /** Per-segment nudge applied to each pill's resting position, in percent
   *  of the ring container. Useful for fine-tuning pill placement per page
   *  without touching the geometric maths. */
  pillOffsets?: { dx?: number; dy?: number }[];
  /** Maximum ring size in px on desktop. Defaults to 360. */
  maxSize?: number;
  ariaLabel?: string;
}

// Ring geometry (SVG viewBox 200x200, radius 80).
const R = 80;
const CIRCUMFERENCE = 2 * Math.PI * R;
// Gap between adjacent segments, in degrees.
const GAP_DEG = 6;
const TOTAL_ARC_DEG = 360 - 3 * GAP_DEG;

const ScoreRingCombined = ({
  segments,
  overall,
  animated = false,
  centerExtra,
  pillOffsets,
  maxSize = 360,
  ariaLabel,
}: ScoreRingCombinedProps) => {
  const clampedOverall = Math.max(9, Math.min(92, Math.round(overall)));
  const [displayScore, setDisplayScore] = useState(animated ? 0 : clampedOverall);
  const [swept, setSwept] = useState(!animated);
  const rafRef = useRef<number>();

  // Proportional arc sizing: each segment's sweep is its pct relative to the
  // sum of all three, spread across the available arc (360 - gaps).
  const sumPct = Math.max(
    1,
    segments.reduce((s, seg) => s + Math.max(0, seg.pct), 0),
  );
  const arcDegs = segments.map((seg) => (Math.max(0, seg.pct) / sumPct) * TOTAL_ARC_DEG);
  const arcLens = arcDegs.map((deg) => (deg / 360) * CIRCUMFERENCE);

  // SVG start angles (0 = 3 o'clock, clockwise positive). Segment 0 starts at
  // the top (-90deg). Each subsequent segment follows the previous arc + gap.
  const startSvgs: number[] = [];
  let cursor = -90;
  arcDegs.forEach((deg, i) => {
    startSvgs[i] = cursor;
    cursor += deg + GAP_DEG;
  });
  // Centre angle of each segment, in "degrees from top, clockwise" (for pills).
  const pillAngles = arcDegs.map((deg, i) => startSvgs[i] + deg / 2 + 90);

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
    const duration = 3200;
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
      {/* Pill labels floating just outside each arc — name + percentage */}
      {segments.map((seg, i) => {
        const rad = (pillAngles[i] * Math.PI) / 180;
        const off = pillOffsets?.[i] ?? {};
        return (
          <span
            key={seg.label}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-background/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground/70 shadow-sm"
            style={{
              left: `${50 + 42 * Math.sin(rad) + (off.dx ?? 0)}%`,
              top: `${50 - 42 * Math.cos(rad) + (off.dy ?? 0)}%`,
              borderColor: seg.color,
              borderWidth: "1.5px",
              borderStyle: "solid",
            }}
          >
            {seg.label} <span className="text-foreground">{Math.round(seg.pct)}%</span>
          </span>
        );
      })}

      <div className="absolute inset-[9%] rounded-full bg-background shadow-[0_18px_60px_-25px_hsl(var(--foreground)/0.25)]">
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
              strokeDasharray={`${arcLens[i]} ${CIRCUMFERENCE - arcLens[i]}`}
              strokeDashoffset={swept ? 0 : arcLens[i]}
              transform={`rotate(${startSvgs[i]} 100 100)`}
              style={{
                transition: animated
                  ? `stroke-dashoffset 4.5s cubic-bezier(0.33, 1, 0.68, 1) ${i * 0.8}s`
                  : undefined,
              }}
            />
          ))}
          {/* White ball at each seam where two segment colours meet, sitting on
              the ring's centreline in the middle of each gap. */}
          {segments.map((seg, i) => {
            const seamDeg = startSvgs[i] - GAP_DEG / 2;
            const rad = (seamDeg * Math.PI) / 180;
            return (
              <circle
                key={`seam-${seg.label}`}
                cx={100 + R * Math.cos(rad)}
                cy={100 + R * Math.sin(rad)}
                r="9"
                fill="#ffffff"
                stroke={seg.color}
                strokeWidth="2"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
              />
            );
          })}
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
