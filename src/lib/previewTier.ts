// Admin/dev preview tier override.
// Lets a logged-in account temporarily experience the app as either a
// free-training user or a paid (premium) user without changing any
// subscription/database state.
//
// Storage: sessionStorage only. Cleared on tab close, ?previewTier=clear, or
// the in-app "Clear Preview" badge action.

const KEY = "leadio_preview_tier";
export const PREVIEW_TIER_CHANGED_EVENT = "leadio:preview-tier-changed";

export type PreviewTier = "free" | "paid" | null;

export const getPreviewTier = (): PreviewTier => {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(KEY);
    return v === "free" || v === "paid" ? v : null;
  } catch {
    return null;
  }
};

export const isFreePreviewActive = (): boolean => getPreviewTier() === "free";
export const isPaidPreviewActive = (): boolean => getPreviewTier() === "paid";

export const setPreviewTier = (tier: PreviewTier) => {
  if (typeof window === "undefined") return;
  try {
    if (tier === "free" || tier === "paid") sessionStorage.setItem(KEY, tier);
    else sessionStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(PREVIEW_TIER_CHANGED_EVENT));
    window.dispatchEvent(new CustomEvent("leadio:premium-changed"));
  } catch {}
};

/** Back-compat helper used elsewhere. */
export const setFreePreview = (on: boolean) => setPreviewTier(on ? "free" : null);

/** Read ?previewTier=free|paid|clear from the URL and apply it once. */
export const initFreePreviewFromUrl = () => {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("previewTier");
    if (!v) return;
    if (v === "free") setPreviewTier("free");
    else if (v === "paid") setPreviewTier("paid");
    else if (v === "clear" || v === "off" || v === "none") setPreviewTier(null);
  } catch {}
};
