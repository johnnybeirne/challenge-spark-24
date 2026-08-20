import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StepHeaderProps {
  /** Day number (1, 2, 3). Required — never hardcode in callers. */
  dayNum: number;
  /** Current step index (1-based). Omit for days without a numbered step flow. */
  stepNumber?: number;
  /** Total steps in the day's flow. Omit if stepNumber is omitted. */
  totalSteps?: number;
  /** Main heading (h1). Optional. */
  heading?: ReactNode;
  /** Subheading paragraph. Optional. */
  subheading?: ReactNode;
  /** Secondary supporting line (rendered under subheading). Optional. */
  secondary?: ReactNode;
  /** Override the eyebrow text entirely (owner-editable copy). */
  eyebrow?: string;
  /** Right-side slot next to the eyebrow (e.g. segmented progress dots). */
  eyebrowAside?: ReactNode;
  className?: string;
}

/**
 * Canonical step-header for Day 1, Day 2, and Day 3 step screens.
 * Every day uses the same eyebrow, heading, and subheading treatment
 * so the three flows can never drift apart again.
 */
const StepHeader = ({
  dayNum,
  stepNumber,
  totalSteps,
  heading,
  subheading,
  secondary,
  eyebrow,
  eyebrowAside,
  className,
}: StepHeaderProps) => {
  const hasStep = typeof stepNumber === "number" && typeof totalSteps === "number";
  const eyebrowText = eyebrow && eyebrow.trim() !== ""
    ? eyebrow
    : hasStep
    ? `Day ${dayNum} · Step ${stepNumber} of ${totalSteps}`
    : `Day ${dayNum}`;

  return (
    <header className={cn("mb-8", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
          {eyebrowText}
        </span>
        {eyebrowAside}
      </div>
      {heading && (
        <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground">
          {heading}
        </h1>
      )}
      {subheading && (
        <p className="mt-3 text-base sm:text-lg font-semibold text-foreground">
          {subheading}
        </p>
      )}
      {secondary && (
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          {secondary}
        </p>
      )}
    </header>
  );
};

export default StepHeader;
