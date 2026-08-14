import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useNavTips } from "@/hooks/useNavTips";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";

const TOUR_STORAGE_KEY = "leadtree_nav_tour_completed_v1";

const TOUR_KEYS = [
  "focus_mode",
  "top_training",
  "top_community",
  "top_events",
  "top_ai_coach",
  "top_leaderboard",
];

function buildSteps(
  byKey: (k: string) => string,
  labelByKey: (k: string) => string,
  firstName: string,
) {
  return TOUR_KEYS.map((k) => {
    const tip = byKey(k);
    if (!tip) return null;
    return {
      element: `[data-tour="${k}"]`,
      popover: {
        title: labelByKey(k) || k,
        description: applyTooltipTokens(tip, firstName),
        side: "bottom" as const,
        align: "center" as const,
      },
    };
  }).filter(Boolean) as { element: string; popover: any }[];
}

export function useNavTour() {
  const { state, authUser, hydrated } = useAppState();
  const { tips, byKey, loaded } = useNavTips();
  const startedRef = useRef(false);

  const labelByKey = (k: string) => tips.find((t) => t.key === k)?.label ?? "";

  const start = () => {
    if (typeof window === "undefined") return;
    // Same resolution the hover tooltips use (TopNavigation/LeftSidebar `tip()`),
    // read fresh at call time so it reflects the latest loaded profile.
    const firstName = resolveFirstName({ stateUserName: state.user?.name, authUser });
    const steps = buildSteps(byKey, labelByKey, firstName).filter((s) =>
      document.querySelector(s.element),
    );
    if (steps.length === 0) return;
    const d = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: "leadtree-tour-popover",
      onDestroyStarted: () => {
        markCompleted();
        d.destroy();
      },
      steps,
    });
    d.drive();
  };

  const markCompleted = async () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    if (authUser?.id) {
      await supabase
        .from("profiles")
        .update({ nav_tour_completed_at: new Date().toISOString() })
        .eq("user_id", authUser.id);
    }
  };

  useEffect(() => {
    if (!loaded || startedRef.current) return;
    if (typeof window === "undefined") return;

    // Only run for authenticated users
    if (!authUser?.id) return;

    // Wait for the participant profile to finish hydrating so state.user.name
    // (and therefore the first-name token) is actually in scope before steps
    // are built — otherwise resolveFirstName returns "" and the strip-fallback
    // fires even for a named user.
    if (!hydrated) return;

    let cancelled = false;
    (async () => {
      // Local check first
      const local = localStorage.getItem(TOUR_STORAGE_KEY);
      if (local) return;

      const { data } = await supabase
        .from("profiles")
        .select("nav_tour_completed_at")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.nav_tour_completed_at) {
        try {
          localStorage.setItem(TOUR_STORAGE_KEY, data.nav_tour_completed_at);
        } catch {
          /* ignore */
        }
        return;
      }

      startedRef.current = true;
      // Delay so nav elements are mounted
      setTimeout(() => start(), 800);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, hydrated, authUser?.id]);

  return { start };
}
