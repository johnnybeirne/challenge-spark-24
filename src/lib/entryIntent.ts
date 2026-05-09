// Canonical entry-intent storage shared by all assessment entry routes.
// One assessment engine, three destinations after results.

export const ENTRY_INTENT_KEY = "leadio_entry_intent";
export const PREMIUM_COUPON_KEY = "leadio_pending_coupon";

export type EntryIntent = "challenge" | "free_training" | "premium_course";

export const setEntryIntent = (intent: EntryIntent) => {
  try {
    sessionStorage.setItem(ENTRY_INTENT_KEY, intent);
  } catch {}
};

export const getEntryIntent = (): EntryIntent | null => {
  try {
    const v = sessionStorage.getItem(ENTRY_INTENT_KEY);
    if (v === "challenge" || v === "free_training" || v === "premium_course") return v;
  } catch {}
  return null;
};

export const setPendingCoupon = (code: string | null | undefined) => {
  try {
    if (code && code.trim()) sessionStorage.setItem(PREMIUM_COUPON_KEY, code.trim().toUpperCase());
  } catch {}
};

export const getPendingCoupon = (): string | null => {
  try {
    const v = sessionStorage.getItem(PREMIUM_COUPON_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
};

export const clearPendingCoupon = () => {
  try { sessionStorage.removeItem(PREMIUM_COUPON_KEY); } catch {}
};
