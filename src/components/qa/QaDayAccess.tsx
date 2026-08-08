// QA control for the day unlock gates.
// It does not reimplement access. It writes and clears exactly the same rows
// the real participant flow uses:
//   - challenge_progress.started_at (the signup anchor for the whole schedule)
//   - unlock_grants (the permanent grant), written with source "qa"
// so anything shown afterwards is the real participant view.

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/context/AppContext";
import { getQaState, updateQaState } from "@/lib/qaPreview";
import { DEFAULT_WINDOW_HOURS, getDayWindow } from "@/lib/daySchedule";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
    {children}
  </div>
);

const QA_SOURCE = "qa";
const DAYS = [1, 2, 3] as const;
const STEP_KEY = "leadioQaJourneyStep";

/**
 * The six-step journey. Each step is fully recomputed from this table, never
 * from a stored snapshot, so Next, Back and Reset all land on the same state.
 * anchorDay N means the signup clock is set to now minus (N-1) windows.
 */
const JOURNEY = [
  {
    label: "Fresh signup",
    anchorDay: 1,
    completed: [] as number[],
    expected: "Day 1 open, Day 2 locked, Day 3 locked",
    path: "/challenge/day-1",
  },
  {
    label: "Day 1 completed",
    anchorDay: 1,
    completed: [1],
    expected: "Day 1 open and completed, Day 2 locked, Day 3 locked",
    path: "/challenge/day-1",
  },
  {
    label: "Clock to end of Day 1 window",
    anchorDay: 2,
    completed: [1],
    expected: "Day 1 locked, Day 2 open, Day 3 locked",
    path: "/challenge/day/2",
  },
  {
    label: "Day 2 completed",
    anchorDay: 2,
    completed: [1, 2],
    expected: "Day 1 locked, Day 2 open and completed, Day 3 locked",
    path: "/challenge/day/2",
  },
  {
    label: "Clock to end of Day 2 window",
    anchorDay: 3,
    completed: [1, 2],
    expected: "Day 1 locked, Day 2 locked, Day 3 open",
    path: "/challenge/day/3",
  },
  {
    label: "Day 3 completed",
    anchorDay: 3,
    completed: [1, 2, 3],
    expected: "Day 3 open and completed, journey end",
    path: "/challenge/day/3",
  },
];


const QaDayAccess = () => {
  const { user } = useAuth();
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const [grants, setGrants] = useState<Record<string, boolean>>({});
  const [windowHours, setWindowHours] = useState(DEFAULT_WINDOW_HOURS);
  const [stepIndex, setStepIndex] = useState(() => {
    const raw = Number(localStorage.getItem(STEP_KEY));
    return Number.isFinite(raw) && raw >= 0 && raw < JOURNEY.length ? raw : 0;
  });
  const [busy, setBusy] = useState(false);

  const loadGrants = useCallback(async () => {
    if (!user?.id) {
      setGrants({});
      return;
    }
    const { data } = await supabase
      .from("unlock_grants")
      .select("gate_key, source")
      .eq("user_id", user.id)
      .in("gate_key", ["day1", "day2", "day3"]);
    const next: Record<string, boolean> = {};
    (data ?? []).forEach((g: any) => {
      next[g.gate_key] = true;
    });
    setGrants(next);
  }, [user?.id]);

  const loadWindow = useCallback(async () => {
    const { data } = await supabase
      .from("unlock_gates")
      .select("window_hours")
      .eq("key", "day1")
      .maybeSingle();
    const h = Number((data as any)?.window_hours);
    if (h > 0) setWindowHours(h);
  }, []);

  useEffect(() => {
    loadGrants();
    loadWindow();
  }, [loadGrants, loadWindow]);

  const grant = async (day: number) => {
    if (!user?.id || busy) return;
    setBusy(true);
    await supabase
      .from("unlock_grants")
      .insert({ user_id: user.id, gate_key: `day${day}`, source: QA_SOURCE });
    await loadGrants();
    setBusy(false);
  };

  const revoke = async (day: number) => {
    if (!user?.id || busy) return;
    setBusy(true);
    await supabase
      .from("unlock_grants")
      .delete()
      .eq("user_id", user.id)
      .eq("gate_key", `day${day}`);
    await loadGrants();
    setBusy(false);
  };

  /**
   * Single write path for the signup anchor, shared by the day jump and the
   * fresh signup reset. Sets the demo participant's signup timestamp to now
   * minus (day - 1) windows, so now falls inside day N's own window, clears
   * the preview-locked override and any persona or simulated date overlay,
   * and removes stale grants so the real gate decides access on its own.
   */
  const applySignupAnchor = async (day: number, clearAllGrants = false) => {
    const qaState = getQaState();
    updateQaState({
      active: true,
      persona: null,
      simulatedJoinedAt: null,
      flags: { ...qaState.flags, previewLockedGates: false },
    });

    // Always compute a fresh anchor from now, never reuse a stale signup time.
    const anchor = new Date(
      Date.now() - (day - 1) * windowHours * 60 * 60 * 1000
    ).toISOString();

    setState((prev) => ({
      ...prev,
      challenge: { ...prev.challenge, currentDay: day, startedAt: anchor, endsAt: null as any },
    }));

    if (user?.id) {
      // Persist the anchor so it survives a reload, since the normal progress
      // save deliberately never writes started_at.
      await (supabase.from("challenge_progress") as any).upsert(
        { user_id: user.id, started_at: anchor, current_day: day },
        { onConflict: "user_id" }
      );

      const stale = DAYS.filter((d) => clearAllGrants || d >= day).map((d) => `day${d}`);
      if (stale.length) {
        await supabase
          .from("unlock_grants")
          .delete()
          .eq("user_id", user.id)
          .in("gate_key", stale);
      }
      await loadGrants();
    }
  };

  const jumpToDay = async (day: number) => {
    if (busy) return;
    setBusy(true);
    await applySignupAnchor(day);
    setBusy(false);
    navigate(`/challenge/day-${day}`);
  };

  /** Fresh signup: signup time is now, no grants, nothing carried over. */
  const freshSignup = async () => {
    if (busy) return;
    setBusy(true);
    await applySignupAnchor(1, true);
    setBusy(false);
    navigate("/challenge/day-1");
  };

  /**
   * Real completion write, scoped to the demo participant. Same rows the real
   * flow uses: challenge.dayCompletedAt in state, persisted to
   * challenge_progress.day_completed_at. Never bypasses the gate.
   */
  const applyCompletions = async (days: number[]) => {
    const stamp = new Date().toISOString();
    const map: Record<string, string> = {};
    days.forEach((d) => {
      map[`day${d}`] = stamp;
    });
    const currentDay = Math.min(3, (days.length ? Math.max(...days) : 0) + 1);

    setState((prev) => ({
      ...prev,
      challenge: {
        ...prev.challenge,
        currentDay,
        completed: days.includes(3),
        dayCompletedAt: map,
      },
    }));

    if (user?.id) {
      await (supabase.from("challenge_progress") as any).upsert(
        { user_id: user.id, day_completed_at: map, current_day: currentDay },
        { onConflict: "user_id" }
      );
    }
  };

  const runStep = async (index: number) => {
    if (busy) return;
    const step = JOURNEY[index];
    if (!step) return;
    setBusy(true);
    await applySignupAnchor(step.anchorDay, true);
    await applyCompletions(step.completed);
    localStorage.setItem(STEP_KEY, String(index));
    setStepIndex(index);
    setBusy(false);
    navigate(step.path);
  };

  const signupAt = state.challenge?.startedAt;
  const step = JOURNEY[stepIndex];


  return (
    <div className="space-y-2 rounded-md border border-rose-500/40 bg-rose-500/5 p-2">
      <SectionLabel>Day Access (real gate)</SectionLabel>

      <button
        disabled={busy}
        onClick={freshSignup}
        className="w-full rounded border border-primary bg-primary px-2 py-1 text-[11px] font-black uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
      >
        Fresh signup (reset)
      </button>

      <div className="flex gap-1.5">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => jumpToDay(d)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-black uppercase tracking-wider hover:bg-muted"
          >
            Go Day {d}
          </button>
        ))}
      </div>


      {DAYS.map((d) => {
        const w = getDayWindow(d, signupAt, windowHours);
        return (
          <div key={d} className="space-y-1 rounded border border-border/60 bg-background p-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
              <span>Day {d}</span>
              <span className={grants[`day${d}`] ? "text-emerald-600" : "text-muted-foreground"}>
                {grants[`day${d}`] ? "Granted" : w?.live ? "In window" : "Locked"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled={busy}
                onClick={() => grant(d)}
                className="rounded border border-primary bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
              >
                Grant unlock
              </button>
              <button
                disabled={busy}
                onClick={() => revoke(d)}
                className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase hover:bg-muted disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Window:{" "}
              {w
                ? `${w.startsAt.toLocaleString()} to ${w.endsAt.toLocaleString()}`
                : "no signup time recorded"}
            </p>
          </div>
        );
      })}

      <p className="text-[10px] leading-snug text-muted-foreground">
        Writes the same signup timestamp and unlock_grants rows the real flow uses, tagged
        source "qa" so it stays out of participant counts. Use it on a demo account only.
      </p>
    </div>
  );
};

export default QaDayAccess;
