import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { resolveFirstName } from "@/lib/tooltipTokens";
import { getReferralUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";

import { useAccessPage, type AccessPageKey } from "@/hooks/useAccessPage";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useAccessSettings } from "@/hooks/useAccessSettings";
import { usePremiumMembershipContent } from "@/hooks/usePremiumMembershipContent";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { MEMBERSHIP_PRICE_ID, MEMBERSHIP_PRICE_LABEL } from "@/lib/membership";




/**
 * Shared access page template — one component, three instances
 * (Training, Community, Events). Renders inside the participant shell only:
 * never adds a second nav, header or footer.
 */
const PAGE_TITLE: Record<AccessPageKey, string> = {
  training: "Training",
  community: "Community",
  events: "Live Events",
};


const AccessPageTemplate = ({ pageKey }: { pageKey: AccessPageKey }) => {
  const { state, authUser } = useAppState();
  const { loading } = useAccessPage(pageKey);
  const { pointsTotal, isSubscribed } = useAccessStatus();
  const { openCheckout, checkoutElement } = useStripeCheckout();

  const { content: membership } = usePremiumMembershipContent();
  const { pointsThreshold } = useAccessSettings();

  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const firstName = resolveFirstName({ stateUserName: state.user?.name, authUser });

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = getReferralUrl("/", inviteCode);


  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Invite link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy — try selecting the link manually");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="app-page-container py-6 pb-24 lg:py-8 animate-fade-in">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header
          className="border-l-4 border-l-[#534AB7] border-[0.5px] border-[var(--border)] bg-[#F0FAF6] rounded-[12px] py-5 px-6"
        >
          <h1 className="text-[var(--h1-size)] font-bold text-[var(--text-primary)]">
            {membership.heading}
          </h1>
          <p
            className="text-[var(--body-size)] leading-[1.6] text-[var(--text-secondary)]"
            style={{ marginTop: "6px" }}
          >
            {membership.description}
          </p>
          <div
            className="w-full"
            style={{ height: "0.5px", backgroundColor: "var(--border)", margin: "14px 0" }}
          />
          <p className="text-[var(--body-size)] text-[var(--text-muted)]">
            You are in <span className="mx-1 text-[var(--body-size)] text-[var(--text-muted)]">›</span>
            <span className="text-[var(--body-size)] font-semibold text-[var(--text-primary)]">
              {PAGE_TITLE[pageKey]}
            </span>
          </p>
        </header>

        {/* SECTION 1 — Get access for free */}
        <section
          className="rounded-[10px] border border-[#1D9E75] bg-background p-5 sm:p-6"
          aria-labelledby="access-free-heading"
        >
          <h2
            id="access-free-heading"
            className="text-[var(--h2-size)] font-bold leading-snug text-[var(--text-primary)]"
          >
            {pointsTotal < pointsThreshold
              ? `${firstName}, share and get free access*.`
              : `${firstName}, share and keep free access*.`}
          </h2>



          {referralLink ? (
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{pointsTotal}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEEDFE]">
                    <div
                      className="h-full rounded-full bg-[#534AB7] transition-all"
                      style={{ width: `${Math.min((pointsTotal / pointsThreshold) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">{pointsThreshold}</span>
                </div>
                
              </div>

              <p
                className="text-center text-[20px] font-medium text-[#534AB7]"
                style={{ marginBottom: "8px" }}
              >
                Your invite link for sharing
              </p>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-[8px] border-[1.5px] border-[#534AB7] bg-white px-4 py-3"
                onClick={copy}
                role="button"
                aria-label="Copy invite link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") copy(); }}
              >
                <code className="flex-1 truncate font-mono text-[13px] text-[var(--text-primary)]">{referralLink}</code>
                <Button variant="ghost" size="icon" className="pointer-events-none h-8 w-8 shrink-0" aria-label="Copy invite link">
                  {copied ? <CheckCircle className="h-4 w-4 text-[#534AB7]" /> : <Copy className="h-4 w-4 text-[#534AB7]" />}
                </Button>
              </div>

              <Button
                onClick={copy}
                className="w-full gap-2 bg-[#1D9E75] font-medium text-white hover:bg-[#1D9E75] hover:text-black"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy invite link"}
              </Button>

              <div className="border-t border-border" />

              <div className="space-y-3">
                <p className="font-semibold">Upgrade instead</p>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed
                    ? "Your membership is active, so this area stays open."
                    : "Skip the points target and get instant access"}
                </p>
                <Button
                  disabled={isSubscribed}
                  onClick={() =>
                    openCheckout({
                      priceId: MEMBERSHIP_PRICE_ID,
                      userId: authUser?.id,
                      customerEmail: authUser?.email ?? undefined,
                    })
                  }
                  className="w-full gap-2 bg-[#534AB7] font-medium text-white hover:bg-[#534AB7]/90"
                >
                  {isSubscribed ? "Membership active" : `Subscribe for ${MEMBERSHIP_PRICE_LABEL}`}
                </Button>
              </div>

            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              Your personal invite link appears here when you're signed in.
            </p>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/invites")}
              className="text-sm text-muted-foreground hover:underline"
            >
              See your full points progress and rewards →
            </button>
          </div>
          <p className="mt-4 text-[11px] italic text-[var(--text-muted)]">
            {membership.asterisk_note}
          </p>

        </section>
      </div>
    </div>
  );
};

export default AccessPageTemplate;
