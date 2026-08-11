// Canonical unlock-gate logic.
// Access to a day is decided by exactly two things:
//   1. The signup-anchored schedule. Each day is live for one window of
//      `window_hours` measured from the participant's signup time, so Day N is
//      live from signup + (N-1) windows to signup + N windows. Before that
//      window and after it, the day is locked. Completion is irrelevant.
//   2. A permanent unlock_grant, earned by inviting N friends who join or by
//      buying the day at the owner-set single price. A granted day stays open
//      for life and never re-locks, whether its window has passed or not.
// Config lives in `unlock_gates`; per-user unlocks live in `unlock_grants`.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useQaPreview } from "@/hooks/useQaPreview";
import { DEFAULT_WINDOW_HOURS, getDayWindow } from "@/lib/daySchedule";

export interface UnlockGateConfig {
  key: string;
  label: string;
  enabled: boolean;
  title: string;
  body: string;
  teaser_lines: number;
  price_cents: number;
  price_id: string;
  invites_required: number;
  show_buy: boolean;
  show_invite: boolean;
  buy_label: string;
  invite_label: string;
  sort_order: number;
  window_hours: number;
  instant_heading: string;
  instant_body: string;
  instant_caption: string;
  progress_template: string;
  progress_complete_text: string;
  dashboard_label: string;
  dashboard_note: string;
  preview_path: string;
}

export const UNLOCK_GATE_DEFAULTS: UnlockGateConfig = {
  key: "",
  label: "",
  enabled: true,
  title: "Unlock this",
  body: "",
  teaser_lines: 3,
  price_cents: 9700,
  price_id: "",
  invites_required: 3,
  show_buy: true,
  show_invite: true,
  buy_label: "Unlock now",
  invite_label: "Invite to unlock",
  sort_order: 0,
  window_hours: DEFAULT_WINDOW_HOURS,
  instant_heading: "Unlock instantly",
  instant_body: "Get access right now and carry on building.",
  instant_caption: "Instant access, no waiting.",
  progress_template: "{joined} of {required} joined, {remaining} more to go",
  progress_complete_text: "You have invited enough friends. Access is open.",
  dashboard_label: "Go to your dashboard",
  dashboard_note: "Everything you have created so far is saved in your dashboard.",
  preview_path: "",
};

export interface UnlockGateOptions {
  /**
   * ISO timestamp of the participant's signup for the challenge. The whole
   * schedule is measured from here.
   */
  signupAt?: string | null;
  /** 1-based position of this day in the schedule. Omit for non-day gates. */
  dayIndex?: number;
}

export function useUnlockGate(gateKey: string, options: UnlockGateOptions = {}) {
  const { signupAt, dayIndex } = options;
  const { state } = useAppState();
  const { user } = useAuth();
  const qa = useQaPreview();
  const [config, setConfig] = useState<UnlockGateConfig | null>(null);
  const [granted, setGranted] = useState(false);
  const [grantSource, setGrantSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const invites = state.network?.direct ?? 0;

  // Simulator only: the previewed journey belongs to a throwaway demo
  // participant, so the per-user input (their permanent grants) comes from the
  // preview overlay rather than the signed-in account. The rule below is
  // unchanged — grant, invites or live window.
  const demo = !!qa.active && !!qa.demoParticipant;
  const demoGrants = qa.demoGrants ?? [];
  const demoGranted = demo && demoGrants.includes(gateKey);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("unlock_gates")
      .select("*")
      .eq("key", gateKey)
      .maybeSingle();
    setConfig(data ? ({ ...UNLOCK_GATE_DEFAULTS, ...(data as any) }) : null);

    if (demo) {
      setGranted(demoGranted);
      setGrantSource(demoGranted ? "demo" : null);
    } else if (user?.id) {
      const { data: grant } = await supabase
        .from("unlock_grants")
        .select("id, source")
        .eq("user_id", user.id)
        .eq("gate_key", gateKey)
        .maybeSingle();
      setGranted(!!grant);
      setGrantSource((grant as any)?.source ?? null);
    } else {
      setGranted(false);
      setGrantSource(null);
    }
    setLoading(false);
  }, [gateKey, user?.id, demo, demoGranted]);

  useEffect(() => {
    load();
  }, [load]);

  const invitesRequired = config?.invites_required ?? 3;
  const invitesMet = !!config?.show_invite && invites >= invitesRequired;

  const windowHours = config?.window_hours ?? DEFAULT_WINDOW_HOURS;
  const dayWindow = dayIndex ? getDayWindow(dayIndex, signupAt, windowHours) : null;
  const inFreeWindow = !!dayWindow?.live;
  const windowEndsAt = dayWindow?.endsAt ?? null;
  const windowStartsAt = dayWindow?.startsAt ?? null;

  // Persist an invite-earned unlock so it survives a later referral reversal.
  // The server re-validates the invite count before recording the grant.
  // The scheduled window is never persisted: it opens and closes on its own.
  // Never runs for a demo participant: the simulator must not write real data.
  useEffect(() => {
    if (demo || !user?.id || !config?.enabled || granted || !invitesMet) return;

    (async () => {
      const { data } = await (supabase.rpc as any)("claim_invite_unlock", {
        p_gate_key: gateKey,
      });
      if (data === true) {
        setGranted(true);
        setGrantSource("invites");
      }
    })();
  }, [user?.id, config?.enabled, granted, invitesMet, gateKey]);


  const gateOff = !config || !config.enabled;
  const unlocked = gateOff || granted || invitesMet || inFreeWindow;

  return {
    loading,
    config,
    unlocked,
    granted,
    grantSource,
    inFreeWindow,
    windowStartsAt,
    windowEndsAt,
    dayWindow,
    invites,
    invitesRequired,
    invitesRemaining: Math.max(0, invitesRequired - invites),
    reason: gateOff
      ? "gate_off"
      : granted
        ? "granted"
        : invitesMet
          ? "invites"
          : inFreeWindow
            ? "in_window"
            : "locked",
    refresh: load,
  };
}
