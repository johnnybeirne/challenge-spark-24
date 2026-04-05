import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

const socialProof = [
  { icon: Zap, text: "Sarah launched her app", time: "2h ago" },
  { icon: Users, text: "James completed Day 2", time: "4h ago" },
  { icon: Share2, text: "Maria shared her score", time: "6h ago" },
];

const Landing = () => {
  const nextMonday = getNextMonday();
  const { d, h, m, s } = useCountdown(nextMonday);

  return (
    <div className="flex flex-col min-h-screen px-5 py-10">
      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center pt-8 pb-6">
        <p className="text-sm font-semibold tracking-widest uppercase text-accent mb-4">
          Challenge OS
        </p>
        <h1 className="text-[2rem] leading-tight font-extrabold text-foreground mb-4">
          How much trust leverage are you sitting on?
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">
          Use your audience — however small — to grow without content burnout.
        </p>
        <Button asChild size="lg" className="w-full rounded-lg text-base font-semibold h-14">
          <Link to="/assess">
            Take the 90-second assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>

      {/* Urgency */}
      <section className="bg-card rounded-lg p-5 mb-6 border border-border">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Next cohort starts{" "}
          <span className="text-foreground font-semibold">
            {nextMonday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Days", value: d },
            { label: "Hours", value: h },
            { label: "Mins", value: m },
            { label: "Secs", value: s },
          ].map((unit) => (
            <div key={unit.label} className="flex flex-col items-center bg-background rounded-md py-3">
              <span className="text-2xl font-bold text-primary tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">{unit.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Promise */}
      <section className="bg-primary/5 rounded-lg p-5 mb-6 border border-primary/10">
        <p className="text-center text-sm font-semibold text-primary leading-relaxed">
          In 3 days, you'll build a system that grows your audience through trust.
        </p>
      </section>

      {/* Social Proof */}
      <section className="mb-8 space-y-3">
        {socialProof.map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border"
          >
            <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <item.icon className="h-4 w-4 text-success" />
            </div>
            <span className="text-sm text-foreground flex-1">{item.text}</span>
            <span className="text-xs text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="pb-4">
        <Button asChild variant="outline" size="lg" className="w-full rounded-lg text-base font-semibold h-14 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Link to="/assess">
            Take the assessment — it's free
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Landing;
