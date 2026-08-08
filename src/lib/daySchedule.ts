// Signup-anchored day schedule.
// Every day is live for exactly one window measured from the participant's
// signup time for the challenge (challenge_progress.started_at):
//   Day 1: signup to signup + W
//   Day 2: signup + W to signup + 2W
//   Day 3: signup + 2W to signup + 3W
// Exactly one day is live at any moment. Completion has no effect on access.
// A permanent unlock_grant (bought or earned by invites) opens a day for life.

export const DEFAULT_WINDOW_HOURS = 24;

export interface DayWindow {
  startsAt: Date;
  endsAt: Date;
  live: boolean;
  /** true when the window has not started yet */
  upcoming: boolean;
  /** true when the window has already ended */
  past: boolean;
}

export function getDayWindow(
  dayIndex: number,
  signupAt?: string | null,
  windowHours: number = DEFAULT_WINDOW_HOURS,
  now: number = Date.now()
): DayWindow | null {
  if (!dayIndex || windowHours <= 0) return null;
  // A missing signup time must never read as long-past. Treat it as signing up
  // right now, so Day 1 is live and later days are simply upcoming.
  const base = signupAt ? new Date(signupAt).getTime() : now;
  if (Number.isNaN(base)) return null;

  const ms = windowHours * 60 * 60 * 1000;
  const startsAt = new Date(base + (dayIndex - 1) * ms);
  const endsAt = new Date(startsAt.getTime() + ms);
  return {
    startsAt,
    endsAt,
    live: now >= startsAt.getTime() && now < endsAt.getTime(),
    upcoming: now < startsAt.getTime(),
    past: now >= endsAt.getTime(),
  };
}
