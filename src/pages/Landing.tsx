import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import { useSiteConfig } from "@/context/SiteConfigContext";

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

const Landing = () => {
  const { config } = useSiteConfig();
  const lc = config.landing;
  const nextMonday = getNextMonday();
  const target = lc.countdownTarget ? new Date(lc.countdownTarget) : (lc.autoAdvanceCountdown ? nextMonday : nextMonday);
  const { d, h, m, s } = useCountdown(target);

  return (
    <div className="flex flex-col min-h-screen px-5 py-10">
      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center pt-8 pb-6">
        <p className="text-sm font-semibold tracking-widest uppercase text-accent mb-4">
          {config.branding.appName}
        </p>
        <h1 className="text-[2rem] leading-tight font-extrabold text-foreground mb-4">
          {lc.heroHeadline}
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">
          {lc.heroSubheadline}
        </p>
        <Button asChild size="lg" className="w-full rounded-lg text-base font-semibold h-14">
          <Link to={lc.primaryCtaLink}>
            {lc.primaryCtaText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>

      {/* Urgency */}
      {lc.showCountdown && (
        <section className="bg-card rounded-lg p-5 mb-6 border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {lc.urgencyText}{" "}
            <span className="text-foreground font-semibold">
              {target.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
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
      )}

      {/* Promise */}
      <section className="bg-primary/5 rounded-lg p-5 mb-6 border border-primary/10">
        <p className="text-center text-sm font-semibold text-primary leading-relaxed">
          {lc.promiseText}
        </p>
      </section>

      {/* Social Proof */}
      {lc.showSocialProof && (
        <section className="mb-8">
          <ActivityFeed limit={3} title="Recent activity" />
        </section>
      )}

      {/* Bottom CTA */}
      <section className="pb-4">
        <Button asChild variant="outline" size="lg" className="w-full rounded-lg text-base font-semibold h-14 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Link to={lc.bottomCtaLink}>
            {lc.bottomCtaText}
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Landing;
