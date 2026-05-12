// Premium access state for Leadio LMS.
// Coupons are stored in the public.coupons table; redemption goes through
// the redeem_coupon RPC. Local premium flag stays in localStorage so we can
// keep iterating without rebuilding the full purchase pipeline.

import { supabase } from "@/integrations/supabase/client";

const PREMIUM_KEY = "leadio_premium_access";
const COUPON_KEY = "leadio_premium_coupon";
const PREMIUM_EVENT = "leadio:premium-changed";

export const isPremiumUser = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    // Free preview override: admin/dev simulating a free user
    if (sessionStorage.getItem("leadio_preview_tier") === "free") return false;
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

/** Validate a coupon against the DB without redeeming it. */
export const validateCoupon = async (raw: string): Promise<CouponResult> => {
  const code = (raw || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Enter a coupon code" };

  const { data, error } = await supabase
    .from("coupons")
    .select("code, label, final_price, original_price, is_active, expires_at, max_redemptions, redemption_count")
    .ilike("code", code)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "Coupon not recognised" };
  if (!data.is_active) return { ok: false, reason: "Coupon is inactive" };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ok: false, reason: "Coupon has expired" };
  }
  if (data.max_redemptions != null && data.redemption_count >= data.max_redemptions) {
    return { ok: false, reason: "Coupon fully redeemed" };
  }
  return {
    ok: true,
    code: data.code,
    finalPrice: data.final_price,
    originalPrice: data.original_price,
    label: data.label || "",
  };
};

/** Redeem a coupon (increments the DB counter atomically). */
export const redeemCoupon = async (raw: string): Promise<CouponResult> => {
  const code = (raw || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Enter a coupon code" };
  const { data, error } = await supabase.rpc("redeem_coupon", { p_code: code });
  if (error) return { ok: false, reason: error.message };
  const r = data as { ok: boolean; reason?: string; code?: string; label?: string; final_price?: number; original_price?: number };
  if (!r?.ok) return { ok: false, reason: r?.reason || "Coupon could not be redeemed" };
  return {
    ok: true,
    code: r.code!,
    finalPrice: r.final_price ?? 0,
    originalPrice: r.original_price ?? 497,
    label: r.label ?? "",
  };
};

export const PREMIUM_CHANGED_EVENT = PREMIUM_EVENT;
