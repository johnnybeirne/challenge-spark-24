import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useNavTips } from "@/hooks/useNavTips";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";

const TOUR_STORAGE_KEY = "leadtree_nav_tour_completed_v1";

function buildSteps(
  tourKeys: string[],
  byKey: (k: string) => string,
  labelByKey: (k: string) => string,
) {
  return tourKeys
    .map((k) => {
      const tip = byKey(k);
      if (!tip) return null;
      return {
        element: `[data-tour="${k}"]`,
        popover: {
          title: labelByKey(k) || k,
          description: tip,
          side: "bottom" as const,
          align: "center" as const,
        },
      };
    })
    .filter(Boolean) as { element: string; popover: any }[];
}

export function useNavTour() {
  const { authUser, state } = useAppState();
  const { tips, byKey: rawByKey, loaded } = useNavTips();
  const startedRef = useRef(false);

  const firstName = resolveFirstName({
    stateUserName: state?.user?.name,
    authUser,
  });
  const byKey = (k: string) => applyTooltipTokens(rawByKey(k), firstName);
  const labelByKey = (k: string) =>
    applyTooltipTokens(tips.find((t) => t.key === k)?.label ?? "", firstName);


  const start = () => {
    if (typeof window === "undefined") return;
    const tourKeys = [...tips]
      .filter((t) => t.in_tour)
      .sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key))
      .map((t) => t.key);
    const steps = buildSteps(tourKeys, byKey, labelByKey).filter((s) =>
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
  }, [loaded, authUser?.id]);

  return { start };
}
