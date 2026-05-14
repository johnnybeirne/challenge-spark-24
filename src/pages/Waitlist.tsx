import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import Confetti from "@/components/Confetti";
import WaitlistActivityFeed from "@/components/WaitlistActivityFeed";
import {
  ArrowRight, Mail, Link2, Users, CheckCircle2, Inbox,
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
  { icon: Mail, title: "Join the waitlist", body: "Reserve your place with your email — takes a few seconds." },
  { icon: Link2, title: "Get your invite link", body: "We send you a unique link to share with friends." },
  { icon: Users, title: "Invite 3 people to unlock priority access to bonus extras", body: "Each confirmed invite counts. Three unlocks priority access to bonus extras." },
];

const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get("ref");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState<WaitlistEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalSignups, setTotalSignups] = useState(0);

  const loadCount = useCallback(async () => {
    const { count } = await supabase
      .from("waitlist_signups")
      .select("id", { count: "exact", head: true });
    if (count !== null) setTotalSignups(count);
  }, []);

  useEffect(() => { loadCount(); }, [loadCount]);

  const sendInviteEmail = async (entry: WaitlistEntry) => {
    const url = `${window.location.origin}/waitlist?ref=${entry.referral_code}`;
    const greeting = entry.name?.trim() ? `Hi ${entry.name.trim()},` : "Hi there,";
    const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ffffff;padding:32px 16px;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You're on the waitlist</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#334155;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;">Thanks for joining the waitlist for the 3-day challenge. Here's your personal invite link:</p>
    <p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">Open your invite link</a></p>
    <p style="font-size:13px;line-height:1.6;margin:0 0 8px;color:#475569;word-break:break-all;">Or share this URL directly:<br/><a href="${url}" style="color:#4f46e5;">${url}</a></p>
    <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#334155;"><strong>Invite 3 people to unlock priority access to bonus extras.</strong></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">— The Leadio team</p>
  </div>
</body></html>`;
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: entry.email,
          subject: "You're on the waitlist",
          html,
        },
      });
    } catch (err) {
      console.error("send-email failed", err);
      toast.message("We saved your spot — if the email doesn't arrive, contact support.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

      const trimmedName = name.trim();
      const { data, error } = await supabase
        .from("waitlist_signups")
        .insert({
          email: trimmed,
          name: trimmedName || null,
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
            toast.info("You're already on the list — we re-sent your invite link.");
            sendInviteEmail(existing);
            navigate(`/waitlist/thanks?ref=${existing.referral_code}`);
          }
        } else {
          toast.error("Something went wrong. Please try again.");
          console.error(error);
        }
      } else if (data) {
        toast.success("You're in! Check your inbox.");
        loadCount();
        sendInviteEmail(data);
        navigate(`/waitlist/thanks?ref=${data.referral_code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSignedUp(null);
    setShowConfetti(false);
    setEmail("");
    setName("");
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <SEO
        title="Waitlist — Leadio"
        description="Join the waitlist for the 3-day challenge. Invite others to unlock priority access to bonus extras."
        canonical="/waitlist"
      />
      <main className="min-h-screen bg-background text-foreground">
        {showConfetti && <Confetti />}

        {/* HERO */}
        <section className="px-5 py-10 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-black uppercase text-primary shadow-sm lg:mx-0">
                Waitlist · Pre-launch
              </p>
              <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:mx-0">
                Run a 3-day challenge people want to share
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
                Join the waitlist before the challenge opens. Invite others to unlock priority access to bonus extras.
              </p>

              {!signedUp ? (
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-8 flex w-full max-w-md flex-col gap-4 lg:mx-0"
                >
                  <Input
                    type="text"
                    required
                    placeholder="First name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 rounded-xl border-border bg-card text-base"
                    maxLength={80}
                  />
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
                    className="mt-1 h-14 w-full gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20"
                  >
                    {loading ? "Joining…" : "Join the Waitlist"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-card p-6 text-left shadow-sm lg:mx-0">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-black uppercase">You're on the list</span>
                  </div>

                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Check your inbox</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        We just sent your invite link to{" "}
                        <span className="break-all font-medium text-foreground">{signedUp.email}</span>.
                        Open it to share with friends and unlock priority access to bonus extras.
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Don't see it? Check spam or promotions.
                  </p>

                  <button
                    onClick={resetForm}
                    className="mt-3 w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                No spam. Waitlist updates only.
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
        {!signedUp && (
          <Section className="border-t border-border">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
                The earlier you join the waitlist, the stronger your starting position.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Invite a few friends after you join to unlock priority access to bonus extras.
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={scrollTop}
                  className="h-14 gap-2 rounded-xl px-8 text-base font-black uppercase shadow-lg shadow-primary/20"
                >
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Section>
        )}
      </main>
    </>
  );
};

export default Waitlist;
