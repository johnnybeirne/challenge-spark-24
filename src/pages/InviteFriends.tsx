import { useEffect, useState } from "react";
import { Copy, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppContext";
import { getReferralUrl } from "@/lib/utils";
import { useReferralStats } from "@/hooks/useReferralStats";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useAccessSettings } from "@/hooks/useAccessSettings";
import { useReferredPeople } from "@/hooks/useReferredPeople";
import { formatFirstNameSurnameInitial, getInitials } from "@/lib/formatName";
import Spinner from "@/components/Spinner";

const GREEN = "#1D9E75";
const BLUE = "#378ADD";
const PURPLE = "#534AB7";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_DEEP = "#26215C";
const GREEN_TINT = "#E1F5EE";
const GREEN_LABEL = "#0F6E56";
const GREEN_DEEP = "#04342C";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts up from 0 to target on mount, about 900ms, ease-out. */
const useCountUp = (target: number, ready: boolean) => {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready || done) return;
    if (prefersReducedMotion() || target <= 0) {
      setValue(target);
      setDone(true);
      return;
    }
    setDone(true);
    const duration = 900;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, target, done]);

  return value;
};

const formatJoined = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const InviteFriends = () => {
  const { state } = useAppState();
  const { pointsTotal, loading: accessLoading } = useAccessStatus();
  const { pointsThreshold } = useAccessSettings();
  const { badges, loading } = useReferralStats();
  const { people, count, loading: peopleLoading } = useReferredPeople();

  const [copied, setCopied] = useState<"quiz" | "challenge" | null>(null);

  const firstName = (state.user?.name ?? "").trim().split(/\s+/)[0] || "";
  const inviteCode = state.user?.inviteCode ?? "";
  const quizLink = getReferralUrl("/assess", inviteCode);
  const challengeLink = getReferralUrl("/", inviteCode);

  const ready = !loading && !accessLoading && !peopleLoading;
  const animatedPoints = useCountUp(pointsTotal, ready);
  const animatedPeople = useCountUp(count, ready);

  const threshold = pointsThreshold || 500;
  const progressPct = Math.max(
    0,
    Math.min(100, threshold > 0 ? (pointsTotal / threshold) * 100 : 0)
  );

  const earnedCount = badges.filter((b) => b.earned).length;

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

  if (!ready) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      {/* 1. Header */}
      <header className="space-y-1">
        <h1 className="text-[var(--h1-size)] font-bold leading-tight text-foreground">
          {firstName ? `${firstName}, here are your invites` : "Here are your invites"}
        </h1>
        <p className="text-[var(--body-size)] text-muted-foreground">
          Invite people to join the challenge and keep your access free every 28 days.
        </p>
      </header>

      {/* 2. Hero stat tiles */}
      <section className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: PURPLE_TINT }}
        >
          <p className="text-xs font-semibold tracking-wide" style={{ color: PURPLE }}>
            Points earned
          </p>
          <p className="mt-1 text-4xl font-bold" style={{ color: PURPLE_DEEP }}>
            {animatedPoints}
          </p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: GREEN_TINT }}>
          <p className="text-xs font-semibold tracking-wide" style={{ color: GREEN_LABEL }}>
            People you've invited
          </p>
          <p className="mt-1 text-4xl font-bold" style={{ color: GREEN_DEEP }}>
            {animatedPeople}
          </p>
        </div>
      </section>

      {/* 3. Points progress bar */}
      <section className="space-y-2">
        <div
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: PURPLE_TINT }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: PURPLE }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{threshold}</span>
        </div>
      </section>

      {/* 4. People you have invited */}
      <section className="space-y-3">
        <h2 className="text-[var(--h2-size)] font-bold text-foreground">
          {firstName
            ? `${firstName}, people you've invited who joined`
            : "People you've invited who joined"}
        </h2>

        {people.length === 0 ? (
          <p className="text-[var(--body-size)] text-muted-foreground">
            Your first signup will appear here when someone joins through your link.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {people.map((p, i) => (
              <li key={`${p.name ?? p.firstName ?? "person"}-${i}`} className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: PURPLE_TINT, color: PURPLE }}
                >
                  {getInitials(p)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[var(--body-size)] font-semibold text-foreground">
                    {formatFirstNameSurnameInitial(p) || "New member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatJoined(p.joinedAt)}
                  </p>
                </div>
                <span
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: GREEN_TINT, color: GREEN_LABEL }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Joined
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. Your invite links */}
      <section className="space-y-4">
        <h2 className="text-[var(--h2-size)] font-bold text-foreground">Your invite links</h2>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[var(--body-size)] font-semibold text-foreground">Quiz link</p>
          <p className="text-[var(--body-size)] text-muted-foreground">
            Send people to the quiz first, higher conversion.
          </p>
          <div className="break-all rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
            {quizLink}
          </div>
          <button
            type="button"
            onClick={() => copy("quiz", quizLink)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[var(--body-size)] font-semibold"
            style={{ backgroundColor: GREEN, color: "#04342C" }}
          >
            {copied === "quiz" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy quiz link
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[var(--body-size)] font-semibold text-foreground">Challenge link</p>
          <p className="text-[var(--body-size)] text-muted-foreground">
            Send people straight to the join page.
          </p>
          <div className="break-all rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
            {challengeLink}
          </div>
          <button
            type="button"
            onClick={() => copy("challenge", challengeLink)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[var(--body-size)] font-semibold"
            style={{ backgroundColor: BLUE, color: "#0A2540" }}
          >
            {copied === "challenge" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy challenge link
          </button>
        </div>
      </section>

      {/* 6. Your badges */}
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
    </div>
  );
};

export default InviteFriends;
