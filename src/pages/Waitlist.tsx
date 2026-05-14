import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shareOrCopy } from "@/lib/share";
import { SEO } from "@/components/SEO";
import Confetti from "@/components/Confetti";
import WaitlistActivityFeed from "@/components/WaitlistActivityFeed";
import {
  ArrowRight, Mail, Link2, Users, Copy, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  confirmed_invites: number;
  waitlist_position: number;
  created_at: string;
}

const Section = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-16 sm:px-6 md:py-24 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const steps = [
  { icon: Mail, title: "Join the list", body: "Reserve your place with your email — takes a few seconds." },
  { icon: Link2, title: "Get your invite link", body: "We send you a unique link to share with friends." },
  { icon: Users, title: "Invite 3 people", body: "Each confirmed invite moves you up. Three unlocks earlier access." },
];

const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState<WaitlistEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalSignups, setTotalSignups] = useState(0);
  const [copied, setCopied] = useState(false);

  const loadCount = useCallback(async () => {
    const { count } = await supabase
      .from("waitlist_signups")
      .select("id", { count: "exact", head: true });
    if (count !== null) setTotalSignups(count);
  }, []);

  useEffect(() => { loadCount(); }, [loadCount]);

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
        loadCount();
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

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <SEO
        title="Early Access — Leadio"
        description="Join early and get priority access when the 3-day challenge opens. Invite others to move up the queue."
        canonical="/waitlist"
      />
      <main className="min-h-screen bg-background text-foreground">
        {showConfetti && <Confetti />}

        {/* HERO */}
        <section className="px-5 py-10 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-black uppercase text-primary shadow-sm lg:mx-0">
                Early access · Pre-launch
              </p>
              <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:mx-0">
                Run a 3-day challenge people want to share
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
                Join early and get priority access when the challenge opens. Invite others to move up the queue.
              </p>

              {!signedUp ? (
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row lg:mx-0"
                >
                  <Input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-xl border-border bg-card text-base"
                    maxLength={255}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20"
                  >
                    {loading ? "Joining…" : "Join Early Access"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-card p-6 text-left shadow-sm lg:mx-0">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-black uppercase">You're on the list</span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground">
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
                      aria-label="Copy invite link"
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
                    className="mt-3 h-11 w-full rounded-xl text-sm font-black uppercase"
                  >
                    Share invite link
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Invite 3 people to unlock earlier access.
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                No spam. Early access only.
                {totalSignups > 0 && (
                  <> · <span className="font-medium text-foreground">{totalSignups.toLocaleString()}</span> joined already</>
                )}
              </p>

              <WaitlistActivityFeed
                title="Live waitlist momentum"
                className="mx-auto mt-8 max-w-md text-left lg:mx-0"
              />
            </div>

            {/* HOW IT WORKS — mirrors AnimatedDayCards layout */}
            <div className="relative space-y-4">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative z-10 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-primary">Step {index + 1}</p>
                      <h2 className="mt-1 text-xl font-black text-foreground">{step.title}</h2>
                      <p className="mt-2 leading-7 text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <Section className="border-t border-border">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
              The earlier you join, the stronger your starting position.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Priority access opens in waves. Joining now — and inviting a few friends — secures your spot in the first one.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                onClick={signedUp ? handleShare : scrollTop}
                className="h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20"
              >
                {signedUp ? "Share invite link" : "Join Early Access"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Section>
      </main>
    </>
  );
};

export default Waitlist;
