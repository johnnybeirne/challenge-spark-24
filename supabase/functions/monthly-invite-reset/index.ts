// Runs on the 1st of every month at 00:01 UTC via pg_cron.
// For each tracked user, if last month's invite_count is below the required
// threshold and the user is not premium, mark them locked out.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REQUIRED_INVITES = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const previousMonthKey = (now: Date): string => {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const month = previousMonthKey(new Date());

    const { data: rows, error } = await supabase
      .from("monthly_invite_tracking")
      .select("id, user_id, invite_count, access_granted")
      .eq("month", month);
    if (error) throw error;

    const shortfall = (rows ?? []).filter(
      (r: any) => !r.access_granted && (r.invite_count ?? 0) < REQUIRED_INVITES,
    );

    let lockedOut = 0;
    if (shortfall.length > 0) {
      const userIds = shortfall.map((r: any) => r.user_id);
      const { data: premiumRows } = await supabase
        .from("profiles")
        .select("user_id, is_premium")
        .in("user_id", userIds);
      const premium = new Set(
        (premiumRows ?? []).filter((p: any) => p.is_premium).map((p: any) => p.user_id),
      );

      const toLock = shortfall.filter((r: any) => !premium.has(r.user_id));
      for (const row of toLock) {
        await supabase
          .from("monthly_invite_tracking")
          .update({ access_status: "locked_out" })
          .eq("id", row.id);
      }
      lockedOut = toLock.length;
    }

    return new Response(JSON.stringify({ ok: true, month, checked: rows?.length ?? 0, lockedOut }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
