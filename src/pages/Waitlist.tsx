import { useState, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import Confetti from "@/components/Confetti";
import WaitlistActivityFeed from "@/components/WaitlistActivityFeed";
import hostImage from "@/assets/johnny-beirne-waitlist-jb.png";
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const WAITLIST_JOIN_TIMEOUT_MS = 15000;

const joinWaitlistPublicly = async (body: {
  first_name: string;
  surname: string;
  email: string;
  referred_by_code: string | null;
}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), WAITLIST_JOIN_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/waitlist-join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.error || "Waitlist signup failed");
    return payload as { data?: WaitlistEntry; existing?: WaitlistEntry };
  } finally {
    window.clearTimeout(timeout);
  }
};

const Section = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`px-5 py-16 sm:px-6 md:py-24 lg:px-8 ${className}`}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const steps = [
  { icon: Mail, title: "Join the waitlist", body: "Reserve your place with your email — takes a few seconds." },
  { icon: Link2, title: "Get your invite link", body: "We send you a unique link to share with friends." },
  { icon: Users, title: "Invite 3 people to unlock priority access to extra bonuses", body: "Each confirmed invite counts. Three unlocks priority access to extra bonuses." },
];

const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get("ref");

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState<WaitlistEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const sendInviteEmail = async (entry: WaitlistEntry) => {
    const url = `https://leadio.johnnybeirne.com/waitlist?ref=${entry.referral_code}`;
    const greeting = entry.name?.trim() ? `Hi ${entry.name.trim()},` : "Hi there,";
    const firstName = entry.name?.trim()?.split(" ")[0] || "there";

    const fallbackHtml = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ffffff;padding:32px 16px;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">You're on the waitlist</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#334155;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#334155;">Thanks for joining the waitlist for the 3-day challenge. Here's your personal invite link:</p>
    <p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">Open your invite link</a></p>
    <p style="font-size:13px;line-height:1.6;margin:0 0 8px;color:#475569;word-break:break-all;">Or share this URL directly:<br/><a href="${url}" style="color:#4f46e5;">${url}</a></p>
    <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#334155;"><strong>Invite 3 people to unlock priority access to extra bonuses.</strong></p>
    <p style="font-size:12px;line-height:1.6;margin:32px 0 0;color:#94a3b8;">— The Leadio team</p>
  </div>
</body></html>`;

    let subject = "You're on the waitlist";
    let html = fallbackHtml;

    try {
      const { data: tpl } = await supabase
        .from("email_templates")
        .select("subject,html_body")
        .eq("id", "waitlist_invite")
        .maybeSingle();
      if (tpl) {
        subject = tpl.subject
          .split("{{greeting}}").join(greeting)
          .split("{{url}}").join(url)
          .split("{{name}}").join(firstName);
        html = tpl.html_body
          .split("{{greeting}}").join(greeting)
          .split("{{url}}").join(url)
          .split("{{name}}").join(firstName);
      }
    } catch (err) {
      console.error("template load failed, using fallback", err);
    }

    try {
      await supabase.functions.invoke("send-email", {
        body: { to: entry.email, subject, html },
      });
    } catch (err) {
      console.error("send-email failed", err);
      toast.message("We saved your spot — if the email doesn't arrive, contact support.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    const trimmedFirst = firstName.trim();
    const trimmedSurname = surname.trim();
    if (!trimmed || !trimmedFirst || !trimmedSurname) return;

    setLoading(true);
    try {
      const resp = await joinWaitlistPublicly({
        first_name: trimmedFirst,
        surname: trimmedSurname,
        email: trimmed,
        referred_by_code: refCode || null,
      });

      const trimmedName = `${trimmedFirst} ${trimmedSurname}`.trim();
      const existing = resp.existing;
      const data = resp.data;

      if (existing) {
        toast.info("You're already on the list — we re-sent your invite link.");
        sendInviteEmail(existing);
        try { sessionStorage.setItem("waitlist:name", existing.name || trimmedName || ""); } catch {}
        navigate(`/waitlist/thanks?ref=${existing.referral_code}`, { state: { name: existing.name || trimmedName || null } });
      } else if (data) {
        toast.success("You're in! Check your inbox.");
        sendInviteEmail(data);
        try { sessionStorage.setItem("waitlist:name", trimmedName); } catch {}
        navigate(`/waitlist/thanks?ref=${data.referral_code}`, { state: { name: trimmedName || null } });
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Signup is taking too long. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSignedUp(null);
    setShowConfetti(false);
    setEmail("");
    setFirstName("");
    setSurname("");
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <SEO
        title="Waitlist — Leadio"
        description="Join the waitlist for the 3-day challenge. Invite others to unlock priority access to extra bonuses."
        canonical="/waitlist"
      />
      <main className="min-h-screen bg-background text-foreground">
        {showConfetti && <Confetti />}

        {/* HERO */}
        <section className="bg-white px-5 py-10 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="text-center lg:text-left">
              <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-black uppercase text-primary shadow-sm lg:mx-0">
                Waitlist · Pre-launch
              </p>
              <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-foreground sm:text-5xl md:text-6xl lg:mx-0">
                Run a 3-day challenge people want to share
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
                Join the waitlist before the challenge opens. Invite others to unlock priority access to extra bonuses
              </p>

              {!signedUp ? (
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-8 flex w-full max-w-md flex-col gap-4 lg:mx-0"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      required
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-14 rounded-xl border-border bg-card text-base"
                      maxLength={80}
                    />
                    <Input
                      type="text"
                      required
                      placeholder="Surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="h-14 rounded-xl border-border bg-card text-base"
                      maxLength={80}
                    />
                  </div>
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
                        Open it to share with friends and unlock priority access to extra bonuses.
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

            {/* HOST PORTRAIT */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="relative overflow-hidden rounded-[2rem]">
                <img
                  src={hostImage}
                  alt="Johnny Beirne"
                  loading="eager"
                  className="block aspect-[4/5] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-border/60 bg-background/85 px-4 py-3 backdrop-blur-sm">
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Hosted by
                    </p>
                    <p className="text-sm font-semibold text-foreground">Johnny Beirne</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <Section className="border-t border-border pt-12 md:pt-16">
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-primary">Step {index + 1}</p>
                    <h2 className="mt-1 text-lg font-black text-foreground">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* FINAL CTA */}
        {!signedUp && (
          <Section className="border-t border-border">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
                The earlier you join the waitlist, the stronger your starting position.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Invite a few friends after you join to unlock priority access to extra bonuses.
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
