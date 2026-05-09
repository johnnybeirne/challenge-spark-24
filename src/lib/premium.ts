// Lightweight premium access state for Leadio LMS.
// No backend changes — uses localStorage so we can iterate quickly.
// Couponing is mock-only (no payment integration).

const PREMIUM_KEY = "leadio_premium_access";
const COUPON_KEY = "leadio_premium_coupon";
const PREMIUM_EVENT = "leadio:premium-changed";

export const VALID_COUPONS: Record<string, { label: string; discount: number; finalPrice: number; originalPrice: number }> = {
  FOUNDING497: {
    label: "Founding member",
    discount: 100,
    finalPrice: 0,
    originalPrice: 497,
  },
};

export const isPremiumUser = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  } catch {
    return false;
  }
};

export const getAppliedCoupon = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(COUPON_KEY);
  } catch {
    return null;
  }
};

export const setPremium = (value: boolean, coupon?: string) => {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      localStorage.setItem(PREMIUM_KEY, "true");
      if (coupon) localStorage.setItem(COUPON_KEY, coupon.toUpperCase());
    } else {
      localStorage.removeItem(PREMIUM_KEY);
      localStorage.removeItem(COUPON_KEY);
    }
    window.dispatchEvent(new CustomEvent(PREMIUM_EVENT));
  } catch {
    /* no-op */
  }
};

export type CouponResult =
  | { ok: true; code: string; finalPrice: number; originalPrice: number; label: string }
  | { ok: false; reason: string };

export const validateCoupon = (raw: string): CouponResult => {
  const code = (raw || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Enter a coupon code" };
  const match = VALID_COUPONS[code];
  if (!match) return { ok: false, reason: "Coupon not recognised" };
  return { ok: true, code, finalPrice: match.finalPrice, originalPrice: match.originalPrice, label: match.label };
};

export const PREMIUM_CHANGED_EVENT = PREMIUM_EVENT;
