import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { applyTooltipTokens, resolveFirstName } from "@/lib/tooltipTokens";
import { shareOrCopy } from "@/lib/share";
import { cn, getReferralUrl } from "@/lib/utils";
import { ReferralLinkField } from "@/components/ReferralLinkField";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { getAccessIcon } from "@/lib/accessPageIcons";
import { useAccessPage, type AccessPageKey } from "@/hooks/useAccessPage";
import { useAccessStatus } from "@/hooks/useAccessStatus";

/**
 * Shared access page template — one component, three instances
 * (Training, Community, Events). It renders ONLY inside the existing
 * participant shell content area: the app shell already provides the single
 * top bar, left sidebar (+ sidebar footer), right sidebar and countdown bar.
 * This template must never add a second nav, header or footer.
 */
const AccessPageTemplate = ({ pageKey }: { pageKey: AccessPageKey }) => {
  const { state, authUser } = useAppState();
  const { content, loading } = useAccessPage(pageKey);
  const { inviteCount, invitesNeeded } = useAccessStatus();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const firstName = resolveFirstName({ stateUserName: state.user?.name, authUser });
  const text = (v?: string) => applyTooltipTokens(v ?? "", firstName);

  // Reuses the existing referral system — the participant's own invite code.
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

  // Single source of truth for order: each item's saved `position`, ascending.
  const items = [...(content?.items ?? [])].sort((a, b) => a.position - b.position);

  const ItemList = ({ list }: { list: typeof items }) =>
    list.length === 0 ? null : (
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((item, i) => {
          const Icon = getAccessIcon(item.icon);
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-semibold leading-snug">{text(item.heading)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text(item.copy)}</p>
            </div>
          );
        })}
      </div>
    );

  return (
    <div className="app-page-container py-6 pb-24 lg:py-8 animate-fade-in">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{text(content?.header_text)}</h1>
          {content?.intro_text && (
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {text(content.intro_text)}
            </p>
          )}
        </header>

        {/* Referral link — the hero of the page */}
        <section className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
          <h2 className="text-xl font-bold tracking-tight">{text(content?.referral_heading)}</h2>
          {content?.referral_copy && (
            <p className="mt-2 text-sm text-muted-foreground">{text(content.referral_copy)}</p>
          )}
          {referralLink ? (
            <>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ReferralLinkField url={referralLink} onCopied={() => setCopied(true)} />
                <Button onClick={copy} size="lg" className="gap-2 text-white">
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
              <button
                onClick={() => shareOrCopy({ text: text(content?.referral_copy), url: referralLink })}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Share2 className="h-3.5 w-3.5" /> Share this link
              </button>
            </>
          ) : (
            <p className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              Your personal invite link appears here when you're signed in.
            </p>
          )}
        </section>

        <ItemList list={items} />
      </div>
    </div>
  );
};

export default AccessPageTemplate;
