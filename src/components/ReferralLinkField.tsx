import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Shared referral link field.
 * - Shows the FULL url (wraps, never truncated) and keeps it selectable.
 * - The whole field is click-to-copy, with a "Click to copy" hint that
 *   briefly flips to "Copied!".
 * Used by the Rewards Ladder invite block and the access pages.
 */
export function ReferralLinkField({
  url,
  className,
  onCopied,
}: {
  url: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link manually");
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={copy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          copy();
        }
      }}
      title="Click to copy"
      className={cn(
        "min-w-0 flex-1 cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/50",
        className
      )}
    >
      <span className="block select-text break-all font-mono text-sm leading-snug">
        {url}
      </span>
      <span
        className={cn(
          "mt-1 block text-[11px] font-medium",
          copied ? "text-primary" : "text-muted-foreground"
        )}
      >
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </div>
  );
}

export default ReferralLinkField;
