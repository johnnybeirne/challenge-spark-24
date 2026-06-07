// Phase 1 — Partner referral attribution capture.
//
// First-touch wins: the first ?ref= (or partner-landing slug) we see in a
// browser session is permanently stored in localStorage + cookie until the
// user signs up (Phase 2 will bind it to a referral_attributions row).
//
// Storage:
//   - localStorage `leadio_attribution`  → JSON { slug, path, query, ts, source }
//   - cookie       `leadio_ref`          → slug (90d, used as fallback if LS cleared)
//
// Resolution:
//   - We do NOT block on a DB lookup at capture time. The slug is stored raw
//     and resolved against `partners.slug` lazily via `resolveAttributionPartner()`.
//   - Result is cached in-memory for the session.

import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "leadio_attribution";
const COOKIE_KEY = "leadio_ref";
const COOKIE_DAYS = 90;

export type AttributionSource =
  | "query_param"
  | "partner_landing"
  | "invite_link"
  | "coupon"
  | "manual";

export interface StoredAttribution {
  slug: string;
  path: string;
  query: Record<string, string>;
  ts: number;
  source: AttributionSource;
}

function setCookie(name: string, value: string, days: number) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string | undefined {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return undefined;
  }
}

export function getStoredAttribution(): StoredAttribution | undefined {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as StoredAttribution;
  } catch {}
  const cookieSlug = getCookie(COOKIE_KEY);
  if (cookieSlug) {
    return { slug: cookieSlug, path: "", query: {}, ts: 0, source: "query_param" };
  }
  return undefined;
}

export function getAttributionSlug(): string | undefined {
  return getStoredAttribution()?.slug;
}

/**
 * Capture a referral slug. First-touch wins — subsequent calls are ignored
 * unless `force` is true.
 */
export function captureAttribution(
  slug: string | null | undefined,
  opts: { source?: AttributionSource; path?: string; query?: Record<string, string>; force?: boolean } = {}
): StoredAttribution | undefined {
  if (!slug) return getStoredAttribution();
  const trimmed = slug.trim();
  if (!trimmed) return getStoredAttribution();

  const existing = getStoredAttribution();
  if (existing && !opts.force) return existing;

  const record: StoredAttribution = {
    slug: trimmed,
    path: opts.path ?? (typeof location !== "undefined" ? location.pathname : ""),
    query: opts.query ?? {},
    ts: Date.now(),
    source: opts.source ?? "query_param",
  };

  try {
    localStorage.setItem(LS_KEY, JSON.stringify(record));
  } catch {}
  setCookie(COOKIE_KEY, trimmed, COOKIE_DAYS);
  return record;
}

export function clearAttribution() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  setCookie(COOKIE_KEY, "", -1);
  _resolvedCache.clear();
}

// ── Slug resolution against partners.slug ──────────────────────────────────

interface ResolvedPartner {
  id: string;
  slug: string;
  display_name: string | null;
  parent_partner_id: string | null;
  status: string;
}

const _resolvedCache = new Map<string, ResolvedPartner | null>();

export async function resolvePartnerBySlug(
  slug: string
): Promise<ResolvedPartner | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  if (_resolvedCache.has(key)) return _resolvedCache.get(key) ?? null;

  const { data } = await (supabase.rpc as any)("resolve_partner_by_slug", { p_slug: key });
  const row = Array.isArray(data) ? data[0] : data;
  const resolved = (row as ResolvedPartner | null) ?? null;
  _resolvedCache.set(key, resolved);
  return resolved;
}

/** Resolve the currently stored attribution slug → partner row, if any. */
export async function resolveAttributionPartner(): Promise<ResolvedPartner | null> {
  const slug = getAttributionSlug();
  if (!slug) return null;
  return resolvePartnerBySlug(slug);
}

// ── Phase 2: bind first-touch attribution to a signed-in user ──────────────

const BOUND_FLAG_PREFIX = "leadio_attribution_bound_";

/**
 * Idempotently writes the user's first-touch attribution to
 * `referral_attributions`. Safe to call on every auth state change — the
 * unique (user_id) constraint plus an in-browser flag prevent dupes.
 */
export async function bindAttributionToUser(userId: string): Promise<void> {
  if (!userId) return;

  const flagKey = BOUND_FLAG_PREFIX + userId;
  try {
    if (localStorage.getItem(flagKey) === "1") return;
  } catch {}

  const stored = getStoredAttribution();
  if (!stored?.slug) return;

  const partner = await resolvePartnerBySlug(stored.slug);
  if (!partner) {
    // Slug doesn't match any partner — nothing to bind. Don't set the flag,
    // in case the partner row is created later.
    return;
  }

  const payload = {
    user_id: userId,
    partner_id: partner.id,
    partner_slug: partner.slug,
    parent_partner_id: partner.parent_partner_id,
    landing_path: stored.path || null,
    landing_query: stored.query || {},
    first_touch_at: stored.ts ? new Date(stored.ts).toISOString() : new Date().toISOString(),
    source: stored.source,
  };

  const { error } = await (supabase.from("referral_attributions") as any)
    .insert(payload);

  // 23505 = unique violation → already bound, treat as success.
  if (!error || error.code === "23505") {
    try { localStorage.setItem(flagKey, "1"); } catch {}
  }
}

