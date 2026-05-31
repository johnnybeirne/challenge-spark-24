// Canonical deadline utilities.
// Every urgency message in the app should render through here so the
// "Have this live by {day}" copy stays personal and live for each user.

export const DEADLINE_OFFSET_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the deadline Date = anchor + 3 days.
 * Anchor falls back to "now" so the message is never empty even for
 * pre-signup visitors (landing pages, etc).
 */
export function getDeadlineDate(anchorISO?: string | null): Date {
  const base = anchorISO ? new Date(anchorISO).getTime() : Date.now();
  const safe = Number.isFinite(base) ? base : Date.now();
  return new Date(safe + DEADLINE_OFFSET_DAYS * DAY_MS);
}

/** Long weekday name in the user's locale, e.g. "Friday". */
export function getDeadlineDayName(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
  } catch {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
}

/** Short calendar label, e.g. "Fri, Jun 6". */
export function formatDeadlineDate(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Substitute {day}, {date}, and any caller-provided tokens into a template.
 * Unknown tokens are left intact so admin typos are visible rather than silent.
 */
export function renderUrgency(
  template: string,
  ctx: Record<string, string | number | undefined>,
): string {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = ctx[key];
    return v === undefined || v === null ? match : String(v);
  });
}
