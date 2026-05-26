import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPremium } from "@/lib/premium";
import { clearPartnerCode } from "@/lib/partner";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      // Webhook will be the source of truth in production. For now, mark
      // premium locally so the user gets immediate access on return.
      setPremium(true, "stripe");
      clearPartnerCode();
    }
  }, [sessionId]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <div className="rounded-3xl border border-success/30 bg-gradient-to-br from-success/10 via-background to-background p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">Welcome to Leadio Premium</h1>
        <p className="mt-3 text-base text-muted-foreground">
          {sessionId
            ? "Your payment is complete. Premium access is now active on this account."
            : "No session information found."}
        </p>

        {sessionId && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="h-12 gap-2 px-6 text-base font-black uppercase">
              <Link to="/blueprint/dashboard">
                <Crown className="h-4 w-4" /> Open Premium Course
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
