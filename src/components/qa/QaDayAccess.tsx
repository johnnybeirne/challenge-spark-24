// QA control for the day unlock gates.
// It does not reimplement access. It writes and clears exactly the same rows
// the real participant flow uses:
//   - challenge_progress.day_completed_at (the free window anchor)
//   - unlock_grants (the persistent grant), written with source "qa"
// so anything shown afterwards is the real participant view.

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/context/AppContext";
import { getQaState, updateQaState } from "@/lib/qaPreview";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
    {children}
  </div>
);

const QA_SOURCE = "qa";
const DAYS = [2, 3] as const;

const QaDayAccess = () => {
  const { user } = useAuth();
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const [grants, setGrants] = useState<Record<string, boolean>>({});
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
      .in("gate_key", ["day2", "day3"]);
    const next: Record<string, boolean> = {};
    (data ?? []).forEach((g: any) => {
      next[g.gate_key] = true;
    });
    setGrants(next);
  }, [user?.id]);

  useEffect(() => {
    loadGrants();
  }, [loadGrants]);

  const setCompletedAt = (dayKey: string, iso: string | null) => {
    setState((prev) => {
      const map = { ...(prev.challenge.dayCompletedAt || {}) };
      if (iso === null) delete map[dayKey];
      else map[dayKey] = iso;
      return { ...prev, challenge: { ...prev.challenge, dayCompletedAt: map } };
    });
  };

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

  /** Simulate the participant finishing the previous day right now. */
  const openFreeWindow = async (day: number) => {
    setCompletedAt(`day${day - 1}`, new Date().toISOString());
    await revoke(day);
  };

  /** Simulate a previous-day completion far enough back that the window elapsed. */
  const expireFreeWindow = async (day: number) => {
    const longAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    setCompletedAt(`day${day - 1}`, longAgo);
    await revoke(day);
  };

  /**
   * Simulate genuinely reaching day N: mark days 1..N-1 complete right now
   * (the same day_completed_at field the real flow writes), clear completions
   * and grants from day N onwards, then navigate. The real gate then decides
   * access on its own, nothing is bypassed.
   */
  const jumpToDay = async (day: number) => {
    if (busy) return;
    setBusy(true);
    // A jump is a fresh simulation, so drop the "preview locked" override that
    // would otherwise force every gate closed no matter what the state says.
    updateQaState({ active: true, flags: { ...getQaState().flags, previewLockedGates: false } });

    // Stamp the prior days as completed right now, so the free window for the
    // target day is open. Reusing an old timestamp would leave it elapsed.
    const stamp = new Date().toISOString();
    setState((prev) => {
      const map: Record<string, string> = {};
      for (let d = 1; d < day; d++) map[`day${d}`] = stamp;
      return {
        ...prev,
        challenge: { ...prev.challenge, currentDay: day, dayCompletedAt: map },
      };
    });

    if (user?.id) {
      const stale = DAYS.filter((d) => d >= day).map((d) => `day${d}`);
      if (stale.length) {
        await supabase
          .from("unlock_grants")
          .delete()
          .eq("user_id", user.id)
          .in("gate_key", stale);
      }
      await loadGrants();
    }

    setBusy(false);
    navigate(`/challenge/day/${day}`);
  };


  const completedAt = state.challenge.dayCompletedAt || {};

  return (
    <div className="space-y-2 rounded-md border border-rose-500/40 bg-rose-500/5 p-2">
      <SectionLabel>Day Access (real gate)</SectionLabel>

      <div className="flex gap-1.5">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            onClick={() => jumpToDay(d)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-black uppercase tracking-wider hover:bg-muted"
          >
            Go Day {d}
          </button>
        ))}
      </div>

      {DAYS.map((d) => (
        <div key={d} className="space-y-1 rounded border border-border/60 bg-background p-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <span>Day {d}</span>
            <span className={grants[`day${d}`] ? "text-emerald-600" : "text-muted-foreground"}>
              {grants[`day${d}`] ? "Granted" : "No grant"}
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
            <button
              disabled={busy}
              onClick={() => openFreeWindow(d)}
              className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase hover:bg-muted disabled:opacity-50"
            >
              Start free window
            </button>
            <button
              disabled={busy}
              onClick={() => expireFreeWindow(d)}
              className="rounded border border-border px-2 py-1 text-[10px] font-bold uppercase hover:bg-muted disabled:opacity-50"
            >
              Expire window
            </button>
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            Day {d - 1} completed at:{" "}
            {completedAt[`day${d - 1}`]
              ? new Date(completedAt[`day${d - 1}`]).toLocaleString()
              : "not recorded"}
          </p>
        </div>
      ))}

      <p className="text-[10px] leading-snug text-muted-foreground">
        Writes the same unlock_grants and day_completed_at rows the real flow uses, tagged
        source "qa" so it stays out of participant counts. Use it on a demo account only.
      </p>
    </div>
  );
};

export default QaDayAccess;
