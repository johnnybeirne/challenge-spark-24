import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";
import { getReferralUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { useAccessPage, type AccessPageKey } from "@/hooks/useAccessPage";
import { useAccessStatus } from "@/hooks/useAccessStatus";

/**
 * Shared access page template — one component, three instances
 * (Training, Community, Events). Renders inside the participant shell only:
 * never adds a second nav, header or footer.
 */
const PAGE_TITLES: Record<AccessPageKey, (firstName: string) => string> = {
  training: (n) => `Welcome to LeadTree Training, ${n}`,
  community: (n) => `Welcome to the LeadTree Community, ${n}`,
  events: (n) => `Welcome to LeadTree Live Events, ${n}`,
};

const AccessPageTemplate = ({ pageKey }: { pageKey: AccessPageKey }) => {
  const { state, authUser } = useAppState();
  const { content, loading } = useAccessPage(pageKey);
  const { pointsTotal, pointsNeeded } = useAccessStatus();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const monthName = new Date().toLocaleString("default", { month: "long" });

  const firstName = resolveFirstName({ stateUserName: state.user?.name, authUser });
  const text = (v?: string) => applyTooltipTokens(v ?? "", firstName);

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

  const title = PAGE_TITLES[pageKey](firstName || "there");

  return (
    <div className="app-page-container py-6 pb-24 lg:py-8 animate-fade-in">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {content?.intro_text && (
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {text(content.intro_text)}
            </p>
          )}
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
            Get monthly access for free when you invite 5 people per month*
          </h2>
          <p className="text-[var(--body-size)] font-normal text-[var(--text-secondary)]">
            or upgrade for $97/month
          </p>


          {referralLink ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-lg bg-[#F0FAF6] p-5">
                <p className="font-semibold">Invite friends</p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {pointsTotal} of 500 points this month
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {pointsTotal} of 500 points in {monthName}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEEDFE]">
                    <div
                      className="h-full rounded-full bg-[#534AB7] transition-all"
                      style={{ width: `${Math.min((pointsTotal / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pointsNeeded === 0
                      ? "You have reached 500 points this month"
                      : `${pointsNeeded} points to go`}
                  </p>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs font-medium text-[var(--text-primary)]">How to earn points</p>
                  <p className="text-xs text-muted-foreground">Complete Day 1: +50 points</p>
                  <p className="text-xs text-muted-foreground">Complete Day 2: +50 points</p>
                  <p className="text-xs text-muted-foreground">Complete Day 3: +50 points</p>
                  <p className="text-xs text-muted-foreground">Each person who signs up through your link: +50 points</p>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Share your link. Every person who signs up counts.
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <Button
                    onClick={copy}
                    className="w-full gap-2 bg-[#1D9E75] font-medium text-black hover:bg-[#1D9E75]/90"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy invite link"}
                  </Button>
                </div>
              </div>

              <div className="hidden w-px bg-border sm:block" />

              <div className="rounded-lg bg-[#EEEDFE] p-5">
                <p className="font-semibold">Upgrade instead</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Skip the invites and get instant access
                </p>
                <Button
                  onClick={() => navigate("/premium")}
                  className="mt-4 w-full gap-2 bg-[#534AB7] font-medium text-white hover:bg-[#534AB7]/90"
                >
                  Upgrade for $97/month
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
              See your full invite progress and rewards →
            </button>
          </div>
          <p className="mt-4 text-[11px] italic text-[var(--text-muted)]">
            *Every person who signs up for the challenge through your link counts toward your monthly 5.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AccessPageTemplate;
