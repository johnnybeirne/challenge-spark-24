// Canonical helper for the Day 1 reset window.
// Reset is available for 24 hours from the user's Day 1 start time
// (challenge.startedAt — first time they began Day 1). After 24 hours
// the Challenge Promise is permanently locked and any change requires
// upgrading to Lifetime Challenge Access ($97) or Lifetime Challenge
// + Premium Course ($497).

export const DAY1_RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getDay1ResetExpiry(startedAt?: string | null): number | null {
  if (!startedAt) return null;
  const t = new Date(startedAt).getTime();
  if (Number.isNaN(t)) return null;
  return t + DAY1_RESET_WINDOW_MS;
}

export function isDay1ResetOpen(startedAt?: string | null, now: number = Date.now()): boolean {
  const expiry = getDay1ResetExpiry(startedAt);
  if (expiry === null) return false;
  return now < expiry;
}

export function day1ResetMsRemaining(startedAt?: string | null, now: number = Date.now()): number {
  const expiry = getDay1ResetExpiry(startedAt);
  if (expiry === null) return 0;
  return Math.max(0, expiry - now);
}
