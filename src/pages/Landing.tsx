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

      {/* Social Proof */}
      <section className="mb-8">
        <ActivityFeed limit={3} title="Recent activity" />
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
