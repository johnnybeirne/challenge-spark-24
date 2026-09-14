// Facebook Pixel helpers. The base snippet + initial PageView live in index.html.
// These helpers fire subsequent PageViews on SPA route changes and standard
// events on conversions.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const FB_PIXEL_ID = "204366789003327";

/** Fire a PageView. Safe to call before the snippet loads (no-op). */
export function fbPageView(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
}

/** Fire a standard Meta event with optional params. No-op if pixel absent. */
export function fbTrack(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}

/** Fire a custom Meta event (non-standard). No-op if pixel absent. */
export function fbTrackCustom(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", event, params);
}
