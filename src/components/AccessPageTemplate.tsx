import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";
import { cn, getReferralUrl } from "@/lib/utils";
import { ReferralLinkField } from "@/components/ReferralLinkField";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { useAccessPage, type AccessPageKey } from "@/hooks/useAccessPage";
import { useReferralStats } from "@/hooks/useReferralStats";

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
  const { currentMonthCount } = useReferralStats();
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
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0F6E56]">
            Get access for free
          </p>
          <h2 id="access-free-heading" className="mt-2 text-lg font-bold leading-snug">
            Invite 5 people this month or upgrade for $97
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Invite 5 people who sign up for the challenge and your access stays free this month.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {inviteCount} of 5 invites this month
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    i < inviteCount ? "bg-[#1D9E75]" : "border border-[#1D9E75] bg-transparent"
                  )}
                />
              ))}
            </div>
          </div>

          {referralLink ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-lg bg-[#F0FAF6] p-5">
                <p className="font-semibold">Invite friends</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invitesNeeded === 0
                    ? "You are all set for this month. Keep inviting to stay ahead."
                    : `Invite ${invitesNeeded} more ${invitesNeeded === 1 ? "person" : "people"} to keep your access free`}
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <ReferralLinkField url={referralLink} onCopied={() => setCopied(true)} />
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
        </section>
      </div>
    </div>
  );
};

export default AccessPageTemplate;
