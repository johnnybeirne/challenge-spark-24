import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Crown, Gift, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clearPartnerCode } from "@/lib/partner";
import { useSiteConfig } from "@/context/SiteConfigContext";

type Outcome =
  | { kind: "pending" }
  | { kind: "delayed" }
  | { kind: "none" }
  | { kind: "reward"; name: string }
  | { kind: "premium" };

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { config } = useSiteConfig();
  const rungs = config?.rewards?.ladder?.rungs ?? [];
  const [outcome, setOutcome] = useState<Outcome>(sessionId ? { kind: "pending" } : { kind: "none" });
  const rungsRef = useRef(rungs);
  rungsRef.current = rungs;

  useEffect(() => {
    if (!sessionId) return;
    clearPartnerCode();

    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      const { data } = await supabase
        .from("purchases")
        .select("price_id, user_id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (cancelled) return;

      const priceId = (data?.price_id as string | undefined) ?? undefined;
      if (priceId) {
        const rung = rungsRef.current.find(
          (r) => r.priceId === priceId || `unlock_${r.gateKey}` === priceId,
        );
        if (rung) {
          const { data: grant } = await supabase
            .from("unlock_grants")
            .select("id")
            .eq("user_id", data.user_id)
            .eq("gate_key", rung.gateKey)
            .maybeSingle();
          if (cancelled) return;
          if (grant) {
            setOutcome({ kind: "reward", name: rung.name });
            return;
          }
        } else {
          setOutcome({ kind: "premium" });
          return;
        }
      }

      // Bound the webhook race so the user always reaches a navigable state.
      if (attempts >= 12) {
        setOutcome({ kind: "delayed" });
        return;
      }
      setTimeout(check, 1500);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const heading =
    outcome.kind === "reward"
      ? `${outcome.name} unlocked`
      : outcome.kind === "premium"
        ? "Welcome to LeadTree Premium"
        : outcome.kind === "delayed"
          ? "Payment complete"
        : outcome.kind === "pending"
          ? "Payment complete"
          : sessionId
            ? "Payment complete"
            : "No session information found";

  const body =
    outcome.kind === "reward"
      ? "Your reward is unlocked on this account. Open the rewards ladder to use it."
      : outcome.kind === "premium"
        ? "Your payment is complete. Premium access is now active on this account."
        : outcome.kind === "delayed"
          ? "Your payment succeeded and your access is being finalised."
        : outcome.kind === "pending"
          ? "Finalising your access. This takes a few seconds."
          : sessionId
            ? "Your payment is complete. Your access will appear shortly. Refresh this page if it does not."
            : "No session information found.";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="rounded-3xl border border-success/30 bg-gradient-to-br from-success/10 via-background to-background p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          {outcome.kind === "pending" ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : outcome.kind === "reward" ? (
            <Gift className="h-7 w-7" />
          ) : (
            <Check className="h-7 w-7" />
          )}
        </div>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">{heading}</h1>
        <p className="mt-3 text-base text-muted-foreground">{body}</p>

        {outcome.kind === "reward" && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="h-12 gap-2 px-6 text-base font-black uppercase">
              <Link to="/rewards">
                <Gift className="h-4 w-4" /> Back to rewards ladder
              </Link>
            </Button>
          </div>
        )}

        {(outcome.kind === "premium" || outcome.kind === "delayed" || outcome.kind === "none") && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="h-12 gap-2 px-6 text-base font-black uppercase">
              <Link to={outcome.kind === "premium" ? "/blueprint/dashboard" : "/rewards"}>
                {outcome.kind === "premium" ? <Crown className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                {outcome.kind === "premium" ? "Open Premium Course" : "Back to Rewards Ladder"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 gap-2 px-6">
              <Link to="/challenger-dashboard">
                <Sparkles className="h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default CheckoutReturn;
