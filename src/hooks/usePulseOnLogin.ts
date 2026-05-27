import { useEffect, useState } from "react";

/**
 * Returns true for ~3 seconds after the user logs in, so we can briefly
 * pulse UI affordances (like collapse buttons) to draw attention to them.
 *
 * Implementation: useAuth sets sessionStorage `leadio_just_logged_in` = "1"
 * on a fresh sign-in. The first component to call this hook in that session
 * reads + clears the flag and turns on the pulse for 3s.
 */
export function usePulseOnLogin(): boolean {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("leadio_just_logged_in") === "1") {
        sessionStorage.removeItem("leadio_just_logged_in");
        setPulse(true);
        const t = setTimeout(() => setPulse(false), 3000);
        return () => clearTimeout(t);
      }
    } catch {
      // sessionStorage unavailable — skip pulse silently
    }
  }, []);

  return pulse;
}
