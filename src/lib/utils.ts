import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Canonical public domain for all shareable/referral links.
 * Always use this for referral URLs so they point to the custom domain
 * regardless of which Lovable preview/publish origin the user is on.
 */
export const CANONICAL_APP_URL = "https://leadtree.johnnybeirne.com";

export function getCanonicalUrl(path = ""): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_APP_URL}${trimmed}`;
}

export function getCompletionDayName(referenceDate: number | Date = Date.now()): string {
  const base = typeof referenceDate === "number" ? referenceDate : referenceDate.getTime();
  return new Date(base + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: "long" });
}
