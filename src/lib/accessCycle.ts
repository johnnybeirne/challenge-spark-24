// Access cycles run in repeating 28 day windows anchored to the participant's
// signup date. They are NOT calendar months.

export const CYCLE_DAYS = 28;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

export interface AccessCycle {
  /** 0 for the first cycle after signup, 1 for the next, and so on */
  index: number;
  startsAt: Date;
  endsAt: Date;
  /** whole days remaining, minimum 0 */
  daysLeft: number;
  /** cycle start as YYYY-MM-DD, used as the tracking row key */
  key: string;
}

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

const anchorMs = (signupAt?: string | null, now: number = Date.now()): number => {
  if (!signupAt) return now;
  const t = new Date(signupAt).getTime();
  return Number.isNaN(t) ? now : t;
};

export function getCycle(
  signupAt?: string | null,
  now: number = Date.now()
): AccessCycle {
  const base = anchorMs(signupAt, now);
  const elapsed = Math.max(0, now - base);
  const index = Math.floor(elapsed / CYCLE_MS);
  return buildCycle(base, index, now);
}

export function getPreviousCycle(
  signupAt?: string | null,
  now: number = Date.now()
): AccessCycle | null {
  const current = getCycle(signupAt, now);
  if (current.index === 0) return null;
  return buildCycle(anchorMs(signupAt, now), current.index - 1, now);
}

function buildCycle(base: number, index: number, now: number): AccessCycle {
  const startsAt = new Date(base + index * CYCLE_MS);
  const endsAt = new Date(startsAt.getTime() + CYCLE_MS);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now) / (24 * 60 * 60 * 1000)));
  return { index, startsAt, endsAt, daysLeft, key: dateKey(startsAt) };
}

/** Short human date, e.g. "6 Sep" */
export function formatCycleDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** true when a timestamp falls inside the cycle window */
export function isInCycle(timestamp: string | undefined, cycle: AccessCycle): boolean {
  if (!timestamp) return false;
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return false;
  return t >= cycle.startsAt.getTime() && t < cycle.endsAt.getTime();
}
