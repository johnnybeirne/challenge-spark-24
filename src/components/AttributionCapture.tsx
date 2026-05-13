import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution } from "@/lib/attribution";

/**
 * Mounted once at the App root. Watches every navigation and captures the
 * first-touch referral attribution from:
 *   - ?ref=<slug>            on any route
 *   - /p/:partnerCode        partner-branded landing
 *   - /premium/:partnerCode  JV premium variant
 *   - /invite/:referralCode  invite link
 *
 * First-touch wins — once captured, subsequent visits do not overwrite.
 */
const PARTNER_PATH_PREFIXES = ["/p/", "/premium/"];
const INVITE_PREFIX = "/invite/";

const AttributionCapture = () => {
  const { search, pathname } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const queryObj: Record<string, string> = {};
    params.forEach((v, k) => { queryObj[k] = v; });

    const refParam = params.get("ref");
    if (refParam) {
      captureAttribution(refParam, {
        source: "query_param",
        path: pathname,
        query: queryObj,
      });
      return;
    }

    // Path-based capture (partner landings + invite links)
    for (const prefix of PARTNER_PATH_PREFIXES) {
      if (pathname.startsWith(prefix)) {
        const slug = pathname.slice(prefix.length).split("/")[0];
        if (slug) {
          captureAttribution(slug, {
            source: "partner_landing",
            path: pathname,
            query: queryObj,
          });
        }
        return;
      }
    }

    if (pathname.startsWith(INVITE_PREFIX)) {
      const slug = pathname.slice(INVITE_PREFIX.length).split("/")[0];
      if (slug) {
        captureAttribution(slug, {
          source: "invite_link",
          path: pathname,
          query: queryObj,
        });
      }
    }
  }, [search, pathname]);

  return null;
};

export default AttributionCapture;
