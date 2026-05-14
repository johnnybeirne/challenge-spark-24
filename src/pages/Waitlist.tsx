import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shareOrCopy } from "@/lib/share";
import { SEO } from "@/components/SEO";
import Confetti from "@/components/Confetti";
import {
  Mail, Link2, Users, ArrowUp, Copy, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

/* ───── types ───── */
interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  confirmed_invites: number;
  waitlist_position: number;
  created_at: string;
}

/* ───── Main component ───── */
const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState<WaitlistEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leaderboard, setLeaderboard] = useState<WaitlistEntry[]>([]);
  const [totalSignups, setTotalSignups] = useState(0);
  const [copied, setCopied] = useState(false);

  /* load leaderboard */
  const loadLeaderboard = useCallback(async () => {
    const { data, count } = await supabase
      .from("waitlist_signups")
      .select("id, email, name, referral_code, confirmed_invites, waitlist_position, created_at", { count: "exact" })
      .order("confirmed_invites", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);
    if (data) setLeaderboard(data);
    if (count !== null) setTotalSignups(count);
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

      const { data, error } = await supabase
        .from("waitlist_signups")
        .insert({
          email: trimmed,
          referral_code: code,
          referred_by_code: refCode || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: existing } = await supabase
            .from("waitlist_signups")
            .select("*")
            .eq("email", trimmed)
            .single();
          if (existing) {
            setSignedUp(existing);
            toast.info("You're already on the list! Here's your referral link.");
          }
        } else {
          toast.error("Something went wrong. Please try again.");
          console.error(error);
        }
      } else if (data) {
        setSignedUp(data);
        setShowConfetti(true);
        toast.success("You're in!");
        loadLeaderboard();
      }
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = signedUp
    ? `${window.location.origin}/waitlist?ref=${signedUp.referral_code}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied");
  };

  const handleShare = () => {
    shareOrCopy({
      title: "Join Leadio Early Access",
      text: "I just joined the Leadio early access list. Join me:",
      url: referralUrl,
    });
  };

  return (
    <>
      <SEO
        title="Early Access — Leadio"
        description="Join early and get priority access to the 3-day challenge. Invite others to move up the queue."
        canonical="/waitlist"
      />
      <div className="min-h-screen bg-background">
        {showConfetti && <Confetti />}

        {/* ── HERO ── */}
        <section className="mx-auto max-w-2xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
          <span className="inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
            Early Access
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Run a 3-day challenge people want to share
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Join early and get priority access when the challenge opens.
            Invite others to move up the queue.
          </p>

          {!signedUp ? (
            <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
              <Input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-card text-base"
                maxLength={255}
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Joining…" : "Join Early Access"}
              </Button>
            </form>
          ) : (
            <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-semibold">You're on the list</span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">
                  #{signedUp.waitlist_position}
                </span>
                <span className="text-sm text-muted-foreground">in queue</span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {signedUp.confirmed_invites > 0
                  ? `${signedUp.confirmed_invites} invite${signedUp.confirmed_invites !== 1 ? "s" : ""} confirmed`
                  : "Share your link to move up"}
              </p>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                <input
                  readOnly
                  value={referralUrl}
                  className="min-w-0 flex-1 truncate bg-transparent text-sm text-foreground outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Button
                onClick={handleShare}
                variant="outline"
                className="mt-3 h-10 w-full rounded-xl text-sm font-medium"
              >
                Share invite link
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Invite 3 people to unlock earlier access.
              </p>
            </div>
          )}

          <p className="mt-5 text-xs text-muted-foreground/60">
            No spam. Early access only.
          </p>

          {totalSignups > 0 && (
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {totalSignups.toLocaleString()} people joined already
            </p>
          )}
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <h2 className="text-center text-lg font-semibold tracking-tight text-foreground">
              How it works
            </h2>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: <Mail className="h-5 w-5" />,
                  title: "Join the list",
                  desc: "Enter your email to reserve your place.",
                },
                {
                  icon: <Link2 className="h-5 w-5" />,
                  title: "Get your invite link",
                  desc: "Receive a unique link to share with others.",
                },
                {
                  icon: <Users className="h-5 w-5" />,
                  title: "Invite 3 people",
                  desc: "Unlock earlier access by inviting friends.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {step.icon}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL MOMENTUM ── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
            <h2 className="text-center text-lg font-semibold tracking-tight text-foreground">
              People are already joining early
            </h2>

            {leaderboard.length > 0 ? (
              <div className="mt-8 space-y-2">
                {leaderboard.slice(0, 8).map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.name || entry.email.replace(/(.{2}).*(@.*)/, "$1***$2")}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {entry.confirmed_invites} invite
                      {entry.confirmed_invites !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Be the first to join and start the momentum.
                </p>
              </div>
            )}

            {totalSignups > 0 && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {totalSignups.toLocaleString()} people on the list
              </p>
            )}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        {!signedUp && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-xl px-6 py-16 text-center sm:py-20">
              <h2 className="text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
                The earlier you join, the stronger your starting position.
              </h2>
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-8 h-12 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Join Early Access
                <ArrowUp className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default Waitlist;
