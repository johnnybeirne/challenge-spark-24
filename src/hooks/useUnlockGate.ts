// Canonical unlock-gate logic.
// A gate locks any piece of content behind three paths, in order:
//   0. A time-boxed free window that starts at the participant's own
//      completion of the previous step (owner-set hours, evergreen, never a
//      calendar date). Opening the content inside that window grants access
//      permanently. If the window elapses unopened, the free path is gone and
//      never reopens.
//   1. Invite N friends who join (state.network.direct)
//   2. Buy it outright (owner-set single price)
// Config lives in `unlock_gates`; per-user unlocks live in `unlock_grants`.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";

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
  free_window_hours: number;
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
  free_window_hours: 24,
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
   * ISO timestamp of the participant's own completion of the previous step.
   * The free window runs for `free_window_hours` from this moment.
   * Pass null/undefined when there is no free window for this gate.
   */
  freeWindowAnchor?: string | null;
}

export function useUnlockGate(gateKey: string, options: UnlockGateOptions = {}) {
  const { freeWindowAnchor } = options;
  const { state } = useAppState();
  const { user } = useAuth();
  const [config, setConfig] = useState<UnlockGateConfig | null>(null);
  const [granted, setGranted] = useState(false);
  const [grantSource, setGrantSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const invites = state.network?.direct ?? 0;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("unlock_gates")
      .select("*")
      .eq("key", gateKey)
      .maybeSingle();
    setConfig(data ? ({ ...UNLOCK_GATE_DEFAULTS, ...(data as any) }) : null);

    if (user?.id) {
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
  }, [gateKey, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const invitesRequired = config?.invites_required ?? 3;
  const invitesMet = !!config?.show_invite && invites >= invitesRequired;

  const windowHours = config?.free_window_hours ?? 0;
  const windowEndsAt =
    freeWindowAnchor && windowHours > 0
      ? new Date(new Date(freeWindowAnchor).getTime() + windowHours * 60 * 60 * 1000)
      : null;
  const inFreeWindow = !!windowEndsAt && windowEndsAt.getTime() > Date.now();

  // Persist any earned unlock so it survives a later referral reversal, and so
  // that opening inside the free window keeps access open afterwards.
  useEffect(() => {
    if (!user?.id || !config?.enabled || granted) return;
    if (!invitesMet && !inFreeWindow) return;
    const source = inFreeWindow && !invitesMet ? "free_window" : "invites";
    (async () => {
      await supabase
        .from("unlock_grants")
        .insert({ user_id: user.id, gate_key: gateKey, source });
      setGranted(true);
      setGrantSource(source);
    })();
  }, [user?.id, config?.enabled, granted, invitesMet, inFreeWindow, gateKey]);

  const gateOff = !config || !config.enabled;
  const unlocked = gateOff || granted || invitesMet || inFreeWindow;

  return {
    loading,
    config,
    unlocked,
    granted,
    grantSource,
    inFreeWindow,
    windowEndsAt,
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
            ? "free_window"
            : "locked",
    refresh: load,
  };
}
