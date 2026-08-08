// Canonical unlock-gate logic.
// A gate locks any piece of content behind TWO equal paths:
//   1. Invite N friends who join (state.network.direct)
//   2. Buy it outright (owner-set price)
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
};

export function useUnlockGate(gateKey: string) {
  const { state } = useAppState();
  const { user } = useAuth();
  const [config, setConfig] = useState<UnlockGateConfig | null>(null);
  const [granted, setGranted] = useState(false);
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
        .select("id")
        .eq("user_id", user.id)
        .eq("gate_key", gateKey)
        .maybeSingle();
      setGranted(!!grant);
    } else {
      setGranted(false);
    }
    setLoading(false);
  }, [gateKey, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const invitesRequired = config?.invites_required ?? 3;
  const invitesMet = !!config?.show_invite && invites >= invitesRequired;

  // Persist the invite-based unlock so it survives a later referral reversal.
  useEffect(() => {
    if (!user?.id || !config?.enabled || granted || !invitesMet) return;
    (async () => {
      await supabase
        .from("unlock_grants")
        .insert({ user_id: user.id, gate_key: gateKey, source: "invites" });
      setGranted(true);
    })();
  }, [user?.id, config?.enabled, granted, invitesMet, gateKey]);

  const gateOff = !config || !config.enabled;
  const unlocked = gateOff || granted || invitesMet;

  return {
    loading,
    config,
    unlocked,
    granted,
    invites,
    invitesRequired,
    invitesRemaining: Math.max(0, invitesRequired - invites),
    reason: gateOff ? "gate_off" : granted ? "granted" : invitesMet ? "invites" : "locked",
    refresh: load,
  };
}
