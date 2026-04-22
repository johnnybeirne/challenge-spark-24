// Shared formatter for the "Next Live Group Q&A" date.
// Uses Intl.DateTimeFormat with the browser's local timezone so admin CMS
// and the public landing page always display the same wall-clock time.

export const QA_TIMEZONE: string =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const longFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: QA_TIMEZONE,
  timeZoneName: "short",
});

const adminFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: QA_TIMEZONE,
});

/** Public landing-page label, e.g. "Thu, 14 May, 7:00 pm GMT". */
export const formatQaDateLong = (iso: string | Date): string =>
  longFormatter.format(typeof iso === "string" ? new Date(iso) : iso);

/** Admin CMS label including year. */
export const formatQaDateAdmin = (iso: string | Date): string =>
  adminFormatter.format(typeof iso === "string" ? new Date(iso) : iso);

/** Returns the time portion of the stored ISO as "HH:mm" in the local timezone, suitable for an <input type="time">. */
export const getLocalTimeValue = (iso: string | Date): string => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: QA_TIMEZONE,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
};
