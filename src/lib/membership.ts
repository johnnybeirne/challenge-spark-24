/**
 * Single source of truth for the paid membership plan.
 * The price id is a Stripe lookup key and is identical in test and live.
 */
export const MEMBERSHIP_PRICE_ID = "membership_monthly";
export const MEMBERSHIP_PRICE_LABEL = "$97/month";

/** Routes that require a paid plan or the points path. */
export const GATED_PATHS = ["/training", "/community", "/calendar"] as const;

export const isGatedPath = (pathname: string): boolean =>
  GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
