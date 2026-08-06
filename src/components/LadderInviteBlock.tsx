import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getReferralUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Shared referral block for the Rewards Ladder.
 * Rendered at the top (how you climb) and the bottom (final nudge).
 * The link is per-participant; heading/body are owner-editable in the CMS.
 */
export function LadderInviteBlock({ className }: { className?: string }) {
  const { state } = useAppState();
  const { config } = useSiteConfig();
  const [copied, setCopied] = useState(false);

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = getCanonicalUrl(`/challenge?ref=${inviteCode}`);

  const heading = config.rewards.ladder.inviteHeading || "Your invite link";
  const body =
    config.rewards.ladder.inviteBody ||
    "Share this — every friend who joins moves you up the ladder.";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <p className="text-sm font-bold tracking-tight">{heading}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 truncate rounded-lg border bg-background px-3 py-2 font-mono text-xs">
          {referralLink}
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0 bg-primary font-semibold text-white hover:brightness-90 hover:text-white focus-visible:text-white"
          onClick={copy}
        >
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export default LadderInviteBlock;
