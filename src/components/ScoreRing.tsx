import { CSSProperties } from "react";

/**
 * ScoreRing — a circular "donut" gauge that shows a percentage.
 *
 * Shared by the Pipeline Scorecard landing page Score preview and the result
 * page category breakdown, so both surfaces render identical rings.
 *
 * Sizing: the ring is capped at `maxSize` (default 200px) on every breakpoint
 * and scales down responsively on smaller screens via `min(maxSize, 42vw)`,
 * so it never exceeds 200px on desktop and shrinks gracefully on mobile.
 *
 * Visual polish:
 *  - The stroke width is proportional to the ring size (inner hole = 86% of
 *    the outer circle), giving a ~7% stroke that reads well at 200px and stays
 *    balanced when scaled down.
 *  - The unfilled portion is a subtle muted track (hsl(var(--muted))) that is
 *    clearly visible but does not compete with the colored fill.
 *  - The percentage text is centered and scales with the ring, so it never
 *    overflows or gets clipped inside the ring.
 *
 * Color logic is owned by the caller (each page keeps its own banding), so
 * this component only renders what it is given — it never changes the color,
 * percentage, or label.
 */
interface ScoreRingProps {
  /** Fill percentage, 0-100. */
  pct: number;
  /** Fill color (any CSS color value, e.g. "#10b981"). */
  color: string;
  /** Optional caption rendered below the ring. */
  label?: string;
  /** Maximum ring size in px on desktop. Defaults to 200. */
  maxSize?: number;
  /** Accessible label for the gauge. */
  ariaLabel?: string;
}

const ScoreRing = ({
  pct,
  color,
  label,
  maxSize = 200,
  ariaLabel,
}: ScoreRingProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  // Cap at maxSize on desktop; scale down on narrower screens so the ring
  // never exceeds maxSize and stays comfortable on mobile.
  const sizeStyle: CSSProperties = {
    width: `min(${maxSize}px, 42vw)`,
    height: `min(${maxSize}px, 42vw)`,
  };
  // Stroke is proportional: inner hole = 86% of the outer circle -> ~7% stroke.
  const innerStyle: CSSProperties = { width: "86%", height: "86%" };
  // Percentage text scales with the ring so it never overflows.
  const textStyle: CSSProperties = {
    fontSize: "clamp(1.125rem, 5.4vw, 1.875rem)",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          ...sizeStyle,
          background: `conic-gradient(${color} 0 ${clamped}%, hsl(var(--muted)) ${clamped}% 100%)`,
        }}
        role={ariaLabel ? "meter" : undefined}
        aria-label={ariaLabel}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background text-center shadow-inner"
          style={innerStyle}
        >
          <span className="font-black leading-none text-foreground" style={textStyle}>
            {clamped}%
          </span>
        </div>
      </div>
      {label ? (
        <span className="max-w-[8rem] text-center text-xs font-black uppercase tracking-wide text-muted-foreground sm:text-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
};

export default ScoreRing;
