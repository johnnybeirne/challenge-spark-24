import { useEffect, useState } from "react";

/**
 * Returns true for ~3 seconds after the user logs in, so we can briefly
 * pulse UI affordances (like collapse buttons) to draw attention to them.
 *
 * Shared module state ensures every consumer (sidebar + right rail) pulses
 * together — otherwise the first mount would clear the flag and later
 * mounts would silently miss the pulse window.
 */
let pulseActive = false;
let pulseExpiresAt = 0;
const listeners = new Set<(v: boolean) => void>();
let initialized = false;

function startPulseIfFlagged() {
  if (initialized) return;
  initialized = true;
  try {
    if (sessionStorage.getItem("leadio_just_logged_in") === "1") {
      sessionStorage.removeItem("leadio_just_logged_in");
      pulseActive = true;
      pulseExpiresAt = Date.now() + 3000;
      listeners.forEach((l) => l(true));
      setTimeout(() => {
        pulseActive = false;
        listeners.forEach((l) => l(false));
      }, 3000);
    }
  } catch {
    // sessionStorage unavailable — skip pulse silently
  }
}

export function usePulseOnLogin(): boolean {
  const [pulse, setPulse] = useState(() => {
    startPulseIfFlagged();
    return pulseActive && Date.now() < pulseExpiresAt;
  });

  useEffect(() => {
    startPulseIfFlagged();
    listeners.add(setPulse);
    // Sync in case state changed between render and effect.
    setPulse(pulseActive && Date.now() < pulseExpiresAt);
    return () => {
      listeners.delete(setPulse);
    };
  }, []);

  return pulse;
}
