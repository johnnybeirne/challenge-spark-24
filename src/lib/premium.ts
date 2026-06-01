// Premium access state for Leadio LMS.
// Source of truth lives in Supabase (`profiles.is_premium` and
// `profiles.partner_code_used`). A small in-memory cache is hydrated by
// `usePremium` so synchronous callers can still read the current value
// without refactoring every call site to async.
//
// localStorage is intentionally NOT used here so the same account on a
// different browser/device always sees the correct premium state.

import { supabase } from "@/integrations/supabase/client";

const PREMIUM_EVENT = "leadio:premium-changed";

// Module-level cache, populated by usePremium / fetchPremiumFromSupabase.
let cachedPremium = false;
let cachedCoupon: string | null = null;

const isPreviewOverride = (): "free" | "paid" | null => {
  if (typeof window === "undefined") return null;
  try {
    const preview = sessionStorage.getItem("leadio_preview_tier");
    if (preview === "free" || preview === "paid") return preview;
  } catch {}
  return null;
};

export const isPremiumUser = (): boolean => {
  const override = isPreviewOverride();
  if (override === "free") return false;
  if (override === "paid") return true;
  return cachedPremium;
};

export const getAppliedCoupon = (): string | null => cachedCoupon;

/** Refresh the cache from Supabase for the currently authenticated user. */
export const fetchPremiumFromSupabase = async (): Promise<{ premium: boolean; coupon: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      cachedPremium = false;
      cachedCoupon = null;
      return { premium: false, coupon: null };
    }
    const { data } = await supabase
      .from("profiles")
      .select("is_premium, partner_code_used")
      .eq("user_id", user.id)
      .maybeSingle();
    cachedPremium = !!data?.is_premium;
    cachedCoupon = (data?.partner_code_used as string | null) ?? null;
  } catch {
    // leave cache as-is
  }
  return { premium: cachedPremium, coupon: cachedCoupon };
};

/** Update premium state in Supabase and notify subscribers. */
export const setPremium = async (value: boolean, coupon?: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const patch: Record<string, unknown> = { is_premium: value };
      if (value) {
        if (coupon) patch.partner_code_used = coupon.toUpperCase();
        patch.premium_since = new Date().toISOString();
      } else {
        patch.partner_code_used = null;
        patch.premium_since = null;
      }
      await supabase.from("profiles").update(patch).eq("user_id", user.id);
    }
    cachedPremium = value;
    cachedCoupon = value ? (coupon ? coupon.toUpperCase() : cachedCoupon) : null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PREMIUM_EVENT));
    }
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
