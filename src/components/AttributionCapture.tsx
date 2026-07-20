import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { captureAttribution } from "@/lib/attribution";

/**
 * Mounted once at the App root. Watches every navigation and captures the
 * first-touch referral attribution from:
 *   - ?ref=<slug>            on ANY route (participant OR partner code)
 *   - /p/:partnerCode        partner-branded landing
 *   - /premium/:partnerCode  JV premium variant
 *   - /invite/:referralCode  invite link
 *
 * Robustness upgrades:
 *   - Any ?ref= on any route is mirrored into sessionStorage so the signup
 *     flow can bind it as `referred_by` regardless of landing route.
 *   - A stable visitor_id cookie is minted on first visit so pre-signup
 *     clicks can be stitched to a later signup/purchase server-side.
 *   - `?ref=` is stripped from the URL after capture so it isn't re-shared
 *     or indexed.
 *   - First-touch wins — subsequent ?ref values do not overwrite.
 */
const PARTNER_PATH_PREFIXES = ["/p/", "/premium/"];
const INVITE_PREFIX = "/invite/";

// Kept in sync with SignupChat.tsx / Assessment.tsx
const REF_SESSION_KEY = "challengeos_ref";
const PARTNER_REF_KEY = "challengeos_partner_ref";
const VISITOR_COOKIE = "leadtree_vid";
const VISITOR_DAYS = 365;

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

function ensureVisitorId(): string | undefined {
  let vid = getCookie(VISITOR_COOKIE);
  if (vid) return vid;
  try {
    vid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    setCookie(VISITOR_COOKIE, vid, VISITOR_DAYS);
    try { localStorage.setItem(VISITOR_COOKIE, vid); } catch {}
  } catch {}
  return vid;
}

function isValidRefCode(raw: string): boolean {
  // guard against garbage: 4-64 chars, alnum + _ -.
  return /^[A-Za-z0-9_-]{4,64}$/.test(raw);
}

function mirrorRefToSession(ref: string) {
  try {
    // First-touch wins for participant code — don't overwrite once set.
    if (ref.startsWith("jv_")) {
      if (!sessionStorage.getItem(PARTNER_REF_KEY)) {
        sessionStorage.setItem(PARTNER_REF_KEY, ref);
      }
    } else {
      if (!sessionStorage.getItem(REF_SESSION_KEY)) {
        sessionStorage.setItem(REF_SESSION_KEY, ref);
      }
    }
  } catch {}
}

const AttributionCapture = () => {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    ensureVisitorId();

    const params = new URLSearchParams(search);
    const queryObj: Record<string, string> = {};
    params.forEach((v, k) => { queryObj[k] = v; });

    const refParam = params.get("ref");
    if (refParam) {
      const trimmed = refParam.trim();
      if (isValidRefCode(trimmed)) {
        // 1) partner-slug capture (LS/cookie for partner attribution binding)
        captureAttribution(trimmed, {
          source: "query_param",
          path: pathname,
          query: queryObj,
        });
        // 2) participant/JV capture (sessionStorage for signup metadata)
        mirrorRefToSession(trimmed);

        // 3) clean the URL so ?ref= isn't re-shared or indexed. Preserve
        //    any other query params + the current path/hash.
        try {
          params.delete("ref");
          const rest = params.toString();
          const cleaned = pathname + (rest ? `?${rest}` : "") + (window.location.hash || "");
          navigate(cleaned, { replace: true });
        } catch {}
      }
      return;
    }

    // Path-based capture (partner landings)
    for (const prefix of PARTNER_PATH_PREFIXES) {
      if (pathname.startsWith(prefix)) {
        const slug = pathname.slice(prefix.length).split("/")[0];
        if (slug && isValidRefCode(slug)) {
          captureAttribution(slug, {
            source: "partner_landing",
            path: pathname,
            query: queryObj,
          });
          mirrorRefToSession(slug);
        }
        return;
      }
    }

    if (pathname.startsWith(INVITE_PREFIX)) {
      const slug = pathname.slice(INVITE_PREFIX.length).split("/")[0];
      if (slug && isValidRefCode(slug)) {
        captureAttribution(slug, {
          source: "invite_link",
          path: pathname,
          query: queryObj,
        });
        mirrorRefToSession(slug);
      }
    }
  }, [search, pathname, navigate]);

  return null;
};

export default AttributionCapture;
