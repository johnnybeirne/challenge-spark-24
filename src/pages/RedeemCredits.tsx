import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Circle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";

const RedeemCredits = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const credits = state.credits?.total ?? 0;
  const completed = new Set(state.challenge?.completedDays ?? []);

  const days = [
    { day: 1, label: "Complete Day 1", value: 10 },
    { day: 2, label: "Complete Day 2", value: 15 },
    { day: 3, label: "Complete Day 3", value: 25 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earn Credits</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete actions to grow your credits and unlock rewards.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Credits track your progress — they are not spent.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Credits</p>
            <p className="text-2xl font-black text-foreground">{credits}</p>
          </div>
        </div>

        {/* Section 1 — Complete the Challenge */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Complete the Challenge
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {days.map((d) => {
              const done = completed.has(d.day);
              return (
                <li key={d.day} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    {done ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground/40" />
                    )}
                    <span className="text-sm font-medium text-foreground">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">+{d.value}</span>
                    <span className={`text-xs ${done ? "text-primary" : "text-muted-foreground"}`}>
                      {done ? "Completed" : "Incomplete"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Section 2 — Invite People */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Invite People (Fastest Way to Earn)
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            <li className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  Invite 1 person who joins
                </span>
              </div>
              <span className="text-sm font-bold text-primary">+50</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Inviting people is the fastest way to unlock rewards.
          </p>
          <Button className="mt-5 w-full gap-2 sm:w-auto" onClick={() => navigate("/referrals")}>
            <UserPlus className="h-4 w-4" /> Invite People
          </Button>
        </section>
      </div>
    </div>
  );
};

export default RedeemCredits;
