import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import Spinner from "@/components/Spinner";

/**
 * One rung's owner-written reward page. Access is derived from the real unlock:
 * points threshold met OR a purchase grant in `unlock_grants` for its gate key.
 */
export default function RewardUnlocked() {
  const { gateKey } = useParams<{ gateKey: string }>();
  const navigate = useNavigate();
  const { state } = useAppState();
  const { config } = useSiteConfig();

  const rung = useMemo(
    () => config.rewards.ladder.rungs.find((r) => r.gateKey === gateKey),
    [config.rewards.ladder.rungs, gateKey],
  );

  const userPoints = state.points?.total ?? 0;
  const earned = !!rung && userPoints >= rung.points;

  const [bought, setBought] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!gateKey) return;
      const { data } = await supabase
        .from("unlock_grants")
        .select("gate_key")
        .eq("gate_key", gateKey)
        .limit(1);
      if (!active) return;
      setBought((data ?? []).length > 0);
      setChecking(false);
    };
    setChecking(true);
    load();
    return () => {
      active = false;
    };
  }, [gateKey]);

  const allowed = earned || bought;

  useEffect(() => {
    if (checking) return;
    if (!rung || !allowed) navigate("/rewards", { replace: true });
  }, [checking, rung, allowed, navigate]);

  if (checking || !rung || !allowed) {
    return (
      <div className="flex min-h-full items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const title = rung.pageTitle?.trim() || rung.name;
  const body = rung.pageBody?.trim() ?? "";

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-background to-muted/40">
      <SEO title={title} description={title} />

      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          <Link
            to="/rewards"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Rewards Ladder
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-xl border bg-card p-5">
            {body ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : null}
          </div>
          <Link
            to="/rewards"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the Rewards Ladder
          </Link>
        </div>
      </main>
    </div>
  );
}
