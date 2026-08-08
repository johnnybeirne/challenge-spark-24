// Standard unlock gate.
// Wrap any locked content:  <UnlockGate gateKey="day1">{content}</UnlockGate>
// Shows a short teaser, then one card with two equal paths: invite N friends,
// or buy it now. Config (price, invites, copy, on/off) is owner-editable at
// /owner-console/unlocks.

import { ReactNode, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, Users, Sparkles } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useUnlockGate } from "@/hooks/useUnlockGate";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import ReferralLinkField from "@/components/ReferralLinkField";
import { getReferralUrl } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { getQaState } from "@/lib/qaPreview";

const formatPrice = (cents: number) =>
  `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

interface Props {
  gateKey: string;
  /** Optional short teaser shown above the unlock card. */
  teaser?: ReactNode;
  children: ReactNode;
}

export function UnlockGate({ gateKey, teaser, children }: Props) {
  const { state } = useAppState();
  const { user } = useAuth();
  const { loading, config, unlocked, invites, invitesRequired, invitesRemaining } =
    useUnlockGate(gateKey);
  const { openCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [fetchedCode, setFetchedCode] = useState<string | null>(null);

  const stateCode = state.user?.inviteCode;

  useEffect(() => {
    if (stateCode || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("invite_code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data?.invite_code) setFetchedCode(data.invite_code);
    })();
    return () => {
      cancelled = true;
    };
  }, [stateCode, user?.id]);

  if (loading) return null;
  const qa = getQaState();
  const forceLocked = qa.active && qa.flags.previewLockedGates;
  if (!config) return <>{children}</>;
  if (unlocked && !forceLocked) return <>{children}</>;

  const referralUrl = getReferralUrl("/", stateCode || fetchedCode || undefined);
  const progress = Math.min(100, Math.round((invites / Math.max(1, invitesRequired)) * 100));


  const handleBuy = () => {
    trackEvent("lock_screen_buy_click", { gate: gateKey });
    openCheckout({
      priceId: config.price_id,
      quantity: 1,
      customerEmail: user?.email ?? undefined,
      userId: user?.id ?? "",
      gateKey,
      returnUrl: `${window.location.origin}${window.location.pathname}?unlocked=1&session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  if (isOpen) {
    return <div className="app-page-container py-6">{checkoutElement}</div>;
  }

  return (
    <div className="app-page-container py-6 pb-24">
      {teaser && (
        <div className="mb-6 text-[var(--body-size)] leading-relaxed text-muted-foreground">
          {teaser}
        </div>
      )}

      <Card className="border-primary/30">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground">{config.title}</h2>
              {config.body && (
                <p className="mt-1 text-sm text-muted-foreground">{config.body}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {config.show_invite && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {config.invite_label} — {invitesRequired} friends
                </p>
                <div className="mt-3">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {invites} of {invitesRequired} joined
                    {invitesRemaining > 0 ? ` — ${invitesRemaining} more to go` : ""}
                  </p>
                </div>
                {referralUrl ? (
                  <div className="mt-3">
                    <ReferralLinkField
                      url={referralUrl}
                      onCopied={() =>
                        trackEvent("lock_screen_referral_share", { gate: gateKey })
                      }
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Your invite link appears here once your profile finishes loading.
                  </p>
                )}
              </div>
            )}

            {config.show_buy && (
              <div className="flex flex-col rounded-xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Unlock instantly
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Prefer not to wait for invites? Get instant access and start right now.
                </p>
                <div className="mt-auto pt-4">
                  <Button className="w-full" onClick={handleBuy}>
                    {config.buy_label} — {formatPrice(config.price_cents)}
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Instant access, no waiting.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-start gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Everything you have created so far is saved in your dashboard.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/challenger-dashboard")}
              className="gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to your dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default UnlockGate;
