import { Check, Lock } from "lucide-react";
import type { ReferralBadge } from "@/hooks/useReferralStats";

const GREEN_TINT = "#E1F5EE";
const GREEN_LABEL = "#0F6E56";

interface ReferralBadgesProps {
  badges: ReferralBadge[];
}

/**
 * "Your badges" section — shared between /invites and /earn.
 * Renders the invite_badges list with earned/locked states.
 */
const ReferralBadges = ({ badges }: ReferralBadgesProps) => {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[var(--h2-size)] font-bold text-foreground">Your badges</h2>
        <span className="text-xs text-muted-foreground">
          {earnedCount} of {badges.length} earned
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {badges.map((b) => (
          <div
            key={b.id}
            className="flex w-[calc(50%-0.5rem)] flex-col items-center gap-1 text-center sm:w-[calc(20%-0.8rem)]"
            style={{ opacity: b.earned ? 1 : 0.4 }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={
                b.earned
                  ? { backgroundColor: GREEN_TINT, color: GREEN_LABEL }
                  : { backgroundColor: "#F1F1F1", color: "#8A8A8A" }
              }
            >
              {b.earned ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
            </div>
            <p className="text-[var(--body-size)] font-semibold text-foreground">{b.name}</p>
            <p className="text-xs text-muted-foreground">{b.threshold} signups</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReferralBadges;
