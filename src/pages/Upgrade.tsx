import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FEATURES = [
  "Advanced challenge templates for any niche",
  "AI systems for daily prompts, reminders, and recaps",
  "Built-in referral mechanics that drive viral signups",
  "Proven launch frameworks for first and repeat runs",
  "Monetization systems to convert challenges into clients",
  "Lifetime access to new templates and frameworks",
];

const Upgrade = () => {
  const copyCoupon = async () => {
    await navigator.clipboard.writeText("FOUNDING50");
    toast.success("Coupon copied");
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-14">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-10 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> ChallengeOS Accelerator
        </div>
        <h1 className="mt-4 text-3xl font-black text-foreground sm:text-4xl">
          Ready to Build Your Full Challenge System?
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          You've learned the fundamentals. Accelerator gives you the templates, AI systems, and growth mechanics to launch
          challenges that actually convert.
        </p>

        <ul className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm text-foreground">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-foreground">€47</span>
            <span className="text-base text-muted-foreground line-through">€97</span>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-success">
              Today
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">One-time payment. No recurring fees.</p>

          <button
            onClick={copyCoupon}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
          >
            Coupon: FOUNDING50 <Copy className="h-3 w-3" />
          </button>

          <Button className="mt-5 h-12 w-full text-base font-black uppercase">
            Upgrade to ChallengeOS Accelerator
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Checkout coming soon.</p>
        </div>
      </div>
    </main>
  );
};

export default Upgrade;
