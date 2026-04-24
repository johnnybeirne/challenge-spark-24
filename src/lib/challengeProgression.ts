export const DAY_UNLOCK_HOURS: Record<number, number> = { 1: 0, 2: 24, 3: 48 };

export function ensureStartedAt(startedAt?: string): string {
  return startedAt || new Date().toISOString();
}

export function getDayUnlock(day: number, startedAt?: string, now = Date.now()) {
  const start = new Date(ensureStartedAt(startedAt)).getTime();
  const unlockAt = start + (DAY_UNLOCK_HOURS[day] ?? 0) * 60 * 60 * 1000;
  const remainingMs = Math.max(0, unlockAt - now);
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return {
    available: remainingMs === 0,
    unlockAt: new Date(unlockAt).toISOString(),
    remainingMs,
    label: remainingMs === 0 ? "Available now" : `Unlocks in ${hours}h ${minutes}m`,
  };
}

export function canAccessDay(day: number, startedAt?: string) {
  return getDayUnlock(day, startedAt).available;
}