import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import Confetti from "@/components/Confetti";
import WaitlistActivityFeed from "@/components/WaitlistActivityFeed";
import hostImage from "@/assets/johnny-beirne-thanks.png";
import { shareOrCopy } from "@/lib/share";
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Lock,
  Sparkles,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  confirmed_invites: number;
  waitlist_position: number;
}

const lockedDays = [
  {
    day: "Day 1",
    title: "Clarify Your Challenge Concept",
    body: "Turn your expertise into a simple challenge people want to join.",
  },
  {
    day: "Day 2",
    title: "Create the Viral Invite Loop",
    body: "Design the referral rewards, share prompts, and participant incentives.",
  },
  {
    day: "Day 3",
    title: "Launch Your First Growth Campaign",
    body: "Map your launch, partner outreach, and first signup push.",
  },
];

const challengeIdeas = [
  "Build my first lead magnet",
  "Launch a paid offer",
  "Grow my audience",
  "Test a new business idea",
  "Something else",
];

const WaitlistThanks = () => {
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const location = useLocation();
  const stateName = (location.state as { name?: string | null } | null)?.name ?? null;
  const navigate = useNavigate();

  const [entry, setEntry] = useState<WaitlistEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pickedIdea, setPickedIdea] = useState<string | null>(null);
  const [otherIdea, setOtherIdea] = useState("");
  const [showConfetti] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ref) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("waitlist_signups")
        .select("id,email,name,referral_code,confirmed_invites,waitlist_position")
        .eq("referral_code", ref)
        .maybeSingle();
      if (!cancelled) {
        setEntry(data ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  const inviteUrl = entry
    ? `https://leadio.johnnybeirne.com/waitlist?ref=${entry.referral_code}`
    : "";

  const copyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy — try selecting the link manually.");
    }
  };

  const share = () => {
    if (!inviteUrl) return;
    shareOrCopy({
      title: "Join me on the waitlist",
      text: "I just joined this 3-day challenge waitlist — thought you'd want in too:",
      url: inviteUrl,
    });
  };

  const submitIdea = () => {
    const value = pickedIdea === "Something else" ? otherIdea.trim() : pickedIdea;
    if (!value) return;
    try {
      sessionStorage.setItem("waitlist:challenge_idea", value);
    } catch {
      // ignore storage errors
    }
    toast.success("Got it — we'll keep that in mind.");
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Link expired
          </p>
          <h1 className="mt-3 text-2xl font-black">We couldn't find that signup.</h1>
          <p className="mt-3 text-muted-foreground">
            Head back to the waitlist to join again.
          </p>
          <Button onClick={() => navigate("/waitlist")} className="mt-6 gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Back to waitlist
          </Button>
        </div>
      </main>
    );
  }

  let storedName: string | null = null;
  try { storedName = sessionStorage.getItem("waitlist:name"); } catch {}
  const rawName = (entry.name || stateName || storedName || "").trim();
  const firstNameRaw = rawName.split(" ")[0];
  const firstName = firstNameRaw
    ? firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1)
    : "";

  return (
    <>
      <SEO
        title="You're on the waitlist — Leadio"
        description="You're on the waitlist for the 3-day challenge. Invite 3 people to unlock priority access to bonus extras."
        canonical="/waitlist/thanks"
      />
      <main className="min-h-screen bg-background text-foreground">
        {showConfetti && <Confetti />}
        {/* SECTION 1 — SUCCESS */}
        <section className="bg-white px-5 pb-0 sm:px-6 lg:px-8" style={{ paddingTop: "10px" }}>
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="pb-10 text-center md:pb-14 lg:pb-20 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-black uppercase text-success shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
                You're in
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                {firstName ? `Congratulations, ${firstName}!` : "Congratulations!"}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mx-0">
                You've successfully joined the waitlist.
              </p>
              <div className="mt-6 flex justify-center lg:justify-start">
                <Button
                  onClick={() => {
                    document.getElementById("invite-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="h-12 gap-2 rounded-xl px-6 font-black uppercase shadow-lg shadow-primary/20"
                >
                  <Sparkles className="h-4 w-4" /> Unlock priority access
                </Button>
              </div>
            </div>

            {/* HOST PORTRAIT */}
            <div className="relative mx-auto -mb-px w-full max-w-xs lg:mx-0 lg:ml-auto lg:max-w-sm">
              <img
                src={hostImage}
                alt="Johnny Beirne"
                loading="eager"
                className="block h-auto w-full object-contain object-bottom"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 — REFERRAL */}
        <section className="px-5 py-10 sm:px-6 md:py-14 lg:px-8">
          <div id="invite-card" className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 scroll-mt-20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight md:text-2xl">
                  Invite 3 people to unlock priority access to bonus extras.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Share your link with friends. Each confirmed invite counts.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 truncate rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                {inviteUrl}
              </div>
              <Button
                onClick={copyLink}
                variant="outline"
                className="h-12 gap-2 rounded-xl px-4"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
              <Button onClick={share} className="h-12 gap-2 rounded-xl px-4 font-black uppercase">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">
                  {entry.confirmed_invites}
                </span>{" "}
                of 3 confirmed invites
              </span>
              <span>No spam. Waitlist updates only.</span>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-5 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-wider text-primary">
                A taste of what's to come
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Your 3-day challenge
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {lockedDays.map((d) => (
                <article
                  key={d.day}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold uppercase text-muted-foreground">
                    <Lock className="h-3 w-3" /> Locked
                  </div>
                  <p className="text-xs font-black uppercase text-primary">{d.day}</p>
                  <h3 className="mt-2 text-xl font-black">{d.title}</h3>
                  <div className="relative mt-3">
                    <p className="text-sm leading-relaxed text-muted-foreground blur-[2px]">
                      {d.body}
                    </p>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-card/40 to-card" />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Coming soon
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — SOCIAL MOMENTUM */}
        <section className="px-5 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                You're not alone on the list
              </h2>
              <p className="mt-3 text-muted-foreground">
                A quiet pulse of people joining and inviting their friends.
              </p>
            </div>
            <WaitlistActivityFeed
              title="Live waitlist momentum"
              className="mt-8 text-left"
            />
          </div>
        </section>

        {/* SECTION 5 — OPTIONAL QUESTION */}
        <section className="border-t border-border px-5 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Optional
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              What kind of challenge would you most want to run?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No pressure — just helps us shape what opens first.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {challengeIdeas.map((idea) => {
                const active = pickedIdea === idea;
                return (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setPickedIdea(idea)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                  >
                    {idea}
                  </button>
                );
              })}
            </div>

            {pickedIdea === "Something else" && (
              <Input
                value={otherIdea}
                onChange={(e) => setOtherIdea(e.target.value)}
                placeholder="Describe it in a few words…"
                className="mt-4 h-12 rounded-xl border-border bg-card"
                maxLength={120}
              />
            )}

            <div className="mt-5">
              <Button
                onClick={submitIdea}
                disabled={
                  !pickedIdea ||
                  (pickedIdea === "Something else" && !otherIdea.trim())
                }
                className="h-12 gap-2 rounded-xl px-6 font-black uppercase"
              >
                Send
              </Button>
            </div>

          </div>
        </section>
      </main>
    </>
  );
};

export default WaitlistThanks;
