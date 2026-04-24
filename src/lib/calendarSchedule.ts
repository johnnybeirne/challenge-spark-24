import type { UserMemory } from "@/lib/personalisation";

const TIME_ZONE = "America/New_York";
const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://challenge-spark-24.lovable.app";

export type CalendarEvent = {
  day: number;
  title: string;
  startsAt: Date;
  endsAt: Date;
  description: string;
  location: string;
};

const eventTitles = [
  "Day 1 – Build Your Challenge",
  "Day 2 – Build & Refine",
  "Day 3 – Launch Your Challenge",
];

function easternParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function easternOffsetMinutes(date: Date) {
  const parts = easternParts(date);
  const utcLike = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return (utcLike - date.getTime()) / 60000;
}

function easternWallTimeToDate(year: number, month: number, day: number, hour: number, minute = 0) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Date(guess.getTime() - easternOffsetMinutes(guess) * 60000);
}

function nextEastern11(startedAt?: string) {
  const base = startedAt ? new Date(startedAt) : new Date();
  const parts = easternParts(base);
  const today11 = easternWallTimeToDate(+parts.year, +parts.month, +parts.day, 11);
  if (base.getTime() <= today11.getTime()) return today11;
  return easternWallTimeToDate(+parts.year, +parts.month, +parts.day + 1, 11);
}

function addDays(date: Date, days: number) {
  const parts = easternParts(date);
  return easternWallTimeToDate(+parts.year, +parts.month, +parts.day + days, 11);
}

function formatCalendarUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildChallengeEvents(firstName: string, memory: UserMemory, startedAt?: string): CalendarEvent[] {
  const start = nextEastern11(startedAt);
  const safeName = firstName || memory.name?.split(" ")[0] || "there";
  return eventTitles.map((title, index) => {
    const startsAt = addDays(start, index);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    return {
      day: index + 1,
      title,
      startsAt,
      endsAt,
      location: "Online – ChallengeOS",
      description: `${safeName}, this is your scheduled time to complete your ChallengeOS Day ${index + 1}.\n\nShow up, follow the steps, and build something real.\n\nYou can access your challenge here:\n${APP_URL}\n\nInvite others to join you and unlock more as you go.`,
    };
  });
}

export function googleCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatCalendarUtc(event.startsAt)}/${formatCalendarUtc(event.endsAt)}`,
    details: event.description,
    location: event.location,
    ctz: TIME_ZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadChallengeIcs(events: CalendarEvent[]) {
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ChallengeOS//3-Day Challenge//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:challengeos-day-${event.day}-${event.startsAt.getTime()}@challengeos`,
      `DTSTAMP:${formatCalendarUtc(new Date())}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DTSTART:${formatCalendarUtc(event.startsAt)}`,
      `DTEND:${formatCalendarUtc(event.endsAt)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "challengeos-3-day-challenge.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}