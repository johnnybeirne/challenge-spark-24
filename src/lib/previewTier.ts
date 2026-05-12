// Free-tier preview override for admins/devs.
// Lets a paid account temporarily experience the app as a free-training user
// without changing any subscription/database state.
//
// Storage: sessionStorage only. Cleared on tab close, ?previewTier=clear, or
// the in-app "Exit Free Preview" badge.

const KEY = "leadio_preview_tier";
export const PREVIEW_TIER_CHANGED_EVENT = "leadio:preview-tier-changed";

export const isFreePreviewActive = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KEY) === "free";
  } catch {
    return false;
  }
};

export const setFreePreview = (on: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (on) sessionStorage.setItem(KEY, "free");
    else sessionStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(PREVIEW_TIER_CHANGED_EVENT));
    // also fires premium-changed so usePremium re-reads
    window.dispatchEvent(new CustomEvent("leadio:premium-changed"));
  } catch {}
};

/** Read ?previewTier=free|clear from the URL and apply it once. */
export const initFreePreviewFromUrl = () => {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("previewTier");
    if (!v) return;
    if (v === "free") setFreePreview(true);
    else if (v === "clear" || v === "off" || v === "none") setFreePreview(false);
  } catch {}
};
