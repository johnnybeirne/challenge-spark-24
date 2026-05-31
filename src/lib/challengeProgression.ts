export const DAY_UNLOCK_HOURS: Record<number, number> = { 1: 0, 2: 24, 3: 48 };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
});

export function ensureStartedAt(startedAt?: string): string {
  return startedAt || new Date().toISOString();
}

export function getDayUnlock(day: number, startedAt?: string, now = Date.now()) {
  const start = new Date(ensureStartedAt(startedAt)).getTime();
  const unlockAt = start + (DAY_UNLOCK_HOURS[day] ?? 0) * 60 * 60 * 1000;
  const remainingMs = Math.max(0, unlockAt - now);
  const dateLabel = day === 2 ? "Tomorrow" : day === 3 ? "Next day" : "Today";

  return {
    available: remainingMs === 0,
    unlockAt: new Date(unlockAt).toISOString(),
    remainingMs,
    label: remainingMs === 0 ? "Available now" : `${dateLabel}, ${dateFormatter.format(new Date(unlockAt))}`,
  };
}

export function canAccessDay(day: number, startedAt?: string) {
  return getDayUnlock(day, startedAt).available;
}