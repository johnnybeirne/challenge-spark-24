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
import { usePremiumMembershipContent } from "@/hooks/usePremiumMembershipContent";



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

const TAG_ORDER: AccessPageKey[] = ["training", "community", "events"];
const TAG_LABELS: Record<AccessPageKey, string> = {
  training: "Training",
  community: "Community",
  events: "Live Events",
};

const AccessPageTemplate = ({ pageKey }: { pageKey: AccessPageKey }) => {
  const { state, authUser } = useAppState();
  const { loading } = useAccessPage(pageKey);
  const { hasAccess, pointsTotal, pointsNeeded, daysLeftInCycle } = useAccessStatus();
  const { content: membership } = usePremiumMembershipContent();

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
          className="space-y-4 border-l-4 border-l-[#534AB7] border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] rounded-[12px] py-5 px-6"
        >
          <span className="inline-block rounded-[20px] bg-[#EEEDFE] px-[10px] py-[3px] text-[10px] font-semibold uppercase text-[#534AB7]">
            ⭐ LeadTree Premium
          </span>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
            {PAGE_TITLE[pageKey]}
          </h1>
          <div className="flex flex-wrap gap-2">
            {TAG_ORDER.map((key) => {
              const active = key === pageKey;
              return (
                <span
                  key={key}
                  className={`rounded-[20px] px-[12px] py-[4px] text-[11px] font-semibold ${
                    active ? "bg-[#1D9E75] text-white" : "bg-[#534AB7] text-white"
                  }`}
                >
                  {TAG_LABELS[key]}
                </span>
              );
            })}
          </div>
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
            {membership.heading}
          </h2>
          <p className="text-[var(--body-size)] font-normal text-[var(--text-secondary)]">
            {membership.description}
          </p>



          {referralLink ? (
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {pointsTotal} of 500 points this cycle
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEEDFE]">
                  <div
                    className="h-full rounded-full bg-[#534AB7] transition-all"
                    style={{ width: `${Math.min((pointsTotal / 500) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {pointsNeeded === 0
                    ? "You have reached 500 points this cycle"
                    : `${pointsNeeded} points to go · ${daysLeftInCycle} days left`}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] px-4 py-3">
                <code className="flex-1 truncate text-sm text-[#1F2937]">{referralLink}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copy} aria-label="Copy invite link">
                  {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
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
                  Skip the points target and get instant access
                </p>
                <Button
                  onClick={() => navigate("/premium")}
                  className="w-full gap-2 bg-[#534AB7] font-medium text-white hover:bg-[#534AB7]/90"
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
