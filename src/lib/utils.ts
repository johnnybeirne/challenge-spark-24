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

/**
 * Build a referral link. Returns "" when the participant has no invite code yet,
 * so callers never render a broken `?ref=` link with an empty code.
 */
export function getReferralUrl(path: string, code?: string | null): string {
  const trimmedCode = (code ?? "").trim();
  if (!trimmedCode) return "";
  // Root path stays as the short "/?ref=" form (no double slash).
  const base = !path || path === "/" ? "/" : path;
  return getCanonicalUrl(`${base}?ref=${encodeURIComponent(trimmedCode)}`);
}


export function getCompletionDayName(referenceDate: number | Date = Date.now()): string {
  const base = typeof referenceDate === "number" ? referenceDate : referenceDate.getTime();
  return new Date(base + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: "long" });
}
