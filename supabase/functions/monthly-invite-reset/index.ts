// Runs daily. Access cycles are rolling 28 day windows anchored to each
// participant's signup date, not calendar months. This job closes out any
// cycle that ended in the last 24 hours: 500 points keeps access active,
// anything less locks the participant out unless they are on the paid plan.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REQUIRED_POINTS = 500;
const CYCLE_DAYS = 28;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

/** The cycle that ended within the last 24 hours, or null when none did. */
function justClosedCycleKey(signupAt: string, now: number): string | null {
  const base = new Date(signupAt).getTime();
  if (Number.isNaN(base) || now <= base) return null;
  const index = Math.floor((now - base) / CYCLE_MS);
  if (index < 1) return null;
  const closedStart = base + (index - 1) * CYCLE_MS;
  const closedEnd = closedStart + CYCLE_MS;
  if (now - closedEnd > DAY_MS) return null;
  return dateKey(new Date(closedStart));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const now = Date.now();

    // Everyone whose 28 day cycle rolled over in the last day.
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, created_at, is_premium");
    if (profilesError) throw profilesError;

    const due: { userId: string; key: string; premium: boolean }[] = [];
    for (const p of profiles ?? []) {
      const key = justClosedCycleKey(p.created_at as string, now);
      if (key) due.push({ userId: p.user_id as string, key, premium: !!p.is_premium });
    }

    let lockedOut = 0;
    let keptActive = 0;

    for (const row of due) {
      const { data: pointRow } = await supabase
        .from("monthly_points_tracking")
        .select("id, points_total")
        .eq("user_id", row.userId)
        .eq("month", row.key)
        .maybeSingle();

      const total = pointRow?.points_total ?? 0;
      const status = total >= REQUIRED_POINTS || row.premium ? "active" : "locked_out";

      if (pointRow?.id) {
        await supabase
          .from("monthly_points_tracking")
          .update({ access_status: status })
          .eq("id", pointRow.id);
      } else {
        await supabase
          .from("monthly_points_tracking")
          .insert({
            user_id: row.userId,
            month: row.key,
            points_total: 0,
            access_status: status,
          });
      }

      if (status === "locked_out") lockedOut++;
      else keptActive++;
    }

    return new Response(JSON.stringify({
      ok: true,
      cycleDays: CYCLE_DAYS,
      checked: due.length,
      lockedOut,
      keptActive,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
