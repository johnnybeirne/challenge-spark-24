import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Listens for SIM_NAVIGATE messages from the challenge simulator (/admin/simulator)
 * and performs an in-app SPA navigation. The simulator embeds the app in an iframe;
 * reassigning the iframe's document URL triggers a new gated document request on the
 * Lovable preview host, so all screen changes after the first load come through here.
 *
 * Only same-origin parent frames are trusted, and only when the app is embedded.
 */
export default function SimulatorBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only meaningful when embedded in the simulator stage.
    if (window.parent === window) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== window.parent) return;
      const data = event.data as { type?: string; path?: string } | null;
      if (!data || data.type !== "SIM_NAVIGATE") return;
      const path = typeof data.path === "string" ? data.path : "";
      // Same-origin relative paths only.
      if (!path.startsWith("/") || path.startsWith("//")) return;
      if (window.location.pathname + window.location.search === path) return;
      navigate(path);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  return null;
}
