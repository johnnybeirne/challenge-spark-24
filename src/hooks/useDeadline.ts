import { useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import {
  getDeadlineDate,
  getDeadlineDayName,
  formatDeadlineDate,
  renderUrgency,
} from "@/lib/deadline";

/**
 * Returns the user's personal "have this live by" deadline.
 *
 * Anchor priority:
 *   1. challenge.startedAt (user has begun the build)
 *   2. user.joinedAt       (signed up but not yet started)
 *   3. now()               (pre-signup visitor — keeps copy non-empty)
 *
 * Tokens available for templates: {day}, {date}.
 * Callers may merge in their own tokens (e.g. {n}, {when}) via render().
 */
export function useDeadline() {
  const { state } = useAppState();
  const anchor = state.challenge?.startedAt || state.user?.joinedAt || null;

  return useMemo(() => {
    const deadlineDate = getDeadlineDate(anchor);
    const day = getDeadlineDayName(deadlineDate);
    const date = formatDeadlineDate(deadlineDate);
    const baseCtx = { day, date };
    return {
      deadlineDate,
      dayName: day,
      dateLabel: date,
      /** Render a template with {day}/{date} plus any extra tokens. */
      render: (template: string, extra?: Record<string, string | number | undefined>) =>
        renderUrgency(template, { ...baseCtx, ...(extra ?? {}) }),
    };
  }, [anchor]);
}
