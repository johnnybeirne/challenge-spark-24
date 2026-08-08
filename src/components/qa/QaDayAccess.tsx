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

const QaDayAccess = () => {
  const { user } = useAuth();
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const [grants, setGrants] = useState<Record<string, boolean>>({});
  const [windowHours, setWindowHours] = useState(DEFAULT_WINDOW_HOURS);
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


  const signupAt = state.challenge?.startedAt;

  return (
    <div className="space-y-2 rounded-md border border-rose-500/40 bg-rose-500/5 p-2">
      <SectionLabel>Day Access (real gate)</SectionLabel>

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
