import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCompletionDayName(referenceDate: number | Date = Date.now()): string {
  const base = typeof referenceDate === "number" ? referenceDate : referenceDate.getTime();
  return new Date(base + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: "long" });
}
