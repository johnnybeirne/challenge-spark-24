import { useState } from "react";
import { Copy, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { getReferralUrl } from "@/lib/utils";
import { useReferralStats } from "@/hooks/useReferralStats";
import Spinner from "@/components/Spinner";

const GREEN = "#1D9E75";
const PURPLE = "#534AB7";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_BORDER = "#AFA9EC";

const InviteFriends = () => {
  const { state } = useAppState();
  const {
    currentMonthCount,
    invitesNeeded,
    allTimeCount,
    featuredCreatorThreshold,
    featuredCreatorRemaining,
    isFeaturedCreator,
    badges,
    loading,
  } = useReferralStats();

  const [copied, setCopied] = useState<"quiz" | "challenge" | null>(null);

  const inviteCode = state.user?.inviteCode ?? "";
  const quizLink = getReferralUrl("/assess", inviteCode);
  const challengeLink = getReferralUrl("/", inviteCode);

  const copy = async (kind: "quiz" | "challenge", url: string) => {
    if (!url) {
      toast.error("Your invite link is not ready yet.");
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(kind);
    toast.success("Link copied");
    setTimeout(() => setCopied(null), 2000);
  };

  const featuredPct = featuredCreatorThreshold
    ? Math.min(100, (allTimeCount / featuredCreatorThreshold) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-[var(--h1-size)] font-bold leading-tight text-foreground">
          Your referral dashboard
        </h1>
        <p className="text-[var(--body-size)] text-muted-foreground">
          Invite people to join the challenge and keep your access free.
        </p>
      </header>

      {/* Section 1 - This month */}
      <section
        className="rounded-xl border-2 bg-card p-5 space-y-4"
        style={{ borderColor: GREEN }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p
              className="text-xs font-semibold tracking-wide"
              style={{ color: GREEN }}
            >
              This month
            </p>
            <h2 className="text-[var(--h2-size)] font-bold text-foreground">
              {currentMonthCount} of 5 signups this month
            </h2>
            <p className="text-[var(--body-size)] text-muted-foreground">
              {invitesNeeded > 0
                ? `${invitesNeeded} more ${invitesNeeded === 1 ? "signup" : "signups"} and your access stays free for another month.`
                : "You are all set for this month."}
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={
              invitesNeeded === 0
                ? { backgroundColor: "#E4F6EF", color: GREEN }
                : { backgroundColor: "#FEF3C7", color: "#92400E" }
            }
          >
            {invitesNeeded === 0 ? "Access active" : "Access at risk"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= currentMonthCount;
            return (
              <div
                key={n}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                style={
                  filled
                    ? { backgroundColor: GREEN, color: "#ffffff" }
                    : { backgroundColor: "#F1F1F1", color: "#8A8A8A" }
                }
              >
                {n}
              </div>
            );
          })}
        </div>

        {currentMonthCount === 0 && (
          <p className="text-[var(--body-size)] text-muted-foreground">
            Share your invite link below to get your first signup this month.
          </p>
        )}
      </section>

      {/* Section 2 - All time */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold tracking-wide" style={{ color: PURPLE }}>
          All time
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-3xl font-bold text-foreground">{allTimeCount}</p>
            <p className="text-[var(--body-size)] text-muted-foreground">Total signups</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-3xl font-bold text-foreground">
              {(allTimeCount / 5).toFixed(1)} mo
            </p>
            <p className="text-[var(--body-size)] text-muted-foreground">
              Free access earned
            </p>
          </div>
        </div>

        {allTimeCount === 0 ? (
          <p className="text-[var(--body-size)] text-muted-foreground">
            Your all-time signups will appear here once your first referral joins.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${featuredPct}%`, backgroundColor: PURPLE }}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {allTimeCount} of {featuredCreatorThreshold} signups
                </span>
                <span>Featured Creator at {featuredCreatorThreshold}</span>
              </div>
            </div>

            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: PURPLE_TINT, borderColor: PURPLE_BORDER }}
            >
              {isFeaturedCreator ? (
                <>
                  <h3 className="text-[var(--h3-size)] font-semibold text-foreground">
                    Featured Creator
                  </h3>
                  <p className="text-[var(--body-size)] text-foreground/70">
                    Your challenge is eligible for promotion. Johnny will be in touch.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-[var(--h3-size)] font-semibold text-foreground">
                    Featured Creator: {featuredCreatorRemaining} signups to go
                  </h3>
                  <p className="text-[var(--body-size)] text-foreground/70">
                    Reach {featuredCreatorThreshold} all-time signups and your challenge gets
                    promoted to the LeadTree community plus a 1-to-1 with Johnny.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {/* Section 3 - Badges */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          Your badges
        </p>
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
                    ? { backgroundColor: GREEN, color: "#ffffff" }
                    : { backgroundColor: "#F1F1F1", color: "#8A8A8A" }
                }
              >
                {b.earned ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </div>
              <p className="text-[var(--body-size)] font-semibold text-foreground">
                {b.name}
              </p>
              <p className="text-xs text-muted-foreground">{b.threshold} signups</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 - Invite links */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          Your invite links
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-[var(--body-size)] font-semibold text-foreground">
              Quiz link
            </p>
            <p className="text-[var(--body-size)] text-muted-foreground">
              Send people to the quiz first, higher conversion.
            </p>
            <p className="break-all text-xs text-muted-foreground">{quizLink}</p>
            <button
              type="button"
              onClick={() => copy("quiz", quizLink)}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[var(--body-size)] font-medium"
              style={{ backgroundColor: GREEN, color: "#000000" }}
            >
              {copied === "quiz" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy quiz link
            </button>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-[var(--body-size)] font-semibold text-foreground">
              Challenge link
            </p>
            <p className="text-[var(--body-size)] text-muted-foreground">
              Send people straight to the challenge join page.
            </p>
            <p className="break-all text-xs text-muted-foreground">{challengeLink}</p>
            <button
              type="button"
              onClick={() => copy("challenge", challengeLink)}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[var(--body-size)] font-medium"
              style={{ backgroundColor: GREEN, color: "#000000" }}
            >
              {copied === "challenge" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy challenge link
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InviteFriends;
