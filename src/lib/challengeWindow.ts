/**
 * Rolling 72-hour challenge window helpers.
 *
 * The deadline is anchored to `challenge.startedAt` (stored UTC). We
 * always compute against the device's current time — no timezone math,
 * no calendar days.
 */
export const CHALLENGE_DURATION_MS = 72 * 60 * 60 * 1000;

export function getChallengeEndsAt(startedAt?: string | null, endsAt?: string | null): string {
  if (endsAt) return endsAt;
  const start = startedAt ? new Date(startedAt).getTime() : Date.now();
  return new Date(start + CHALLENGE_DURATION_MS).toISOString();
}

export function getRemainingMs(endsAt: string, now: number = Date.now()): number {
  return Math.max(0, new Date(endsAt).getTime() - now);
}

export function isChallengeExpired(endsAt?: string | null, now: number = Date.now()): boolean {
  if (!endsAt) return false;
  return getRemainingMs(endsAt, now) <= 0;
}

export function formatRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
