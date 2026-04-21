import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_PASSWORD = "challengeos2024";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Get all events
    const { data: events, error } = await sb
      .from("analytics_events")
      .select("event_name, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Count by event
    const counts: Record<string, number> = {};
    for (const e of events ?? []) {
      counts[e.event_name] = (counts[e.event_name] || 0) + 1;
    }

    // Daily breakdown (last 30 days)
    const daily: Record<string, Record<string, number>> = {};
    for (const e of events ?? []) {
      const day = e.created_at.slice(0, 10);
      if (!daily[day]) daily[day] = {};
      daily[day][e.event_name] = (daily[day][e.event_name] || 0) + 1;
    }

    // User list with referral data
    const { data: users } = await sb
      .from("profiles")
      .select("name, email, invite_code, referred_by, direct_referral_count, indirect_referral_count, created_at")
      .order("created_at", { ascending: false });

    return new Response(
      JSON.stringify({
        counts,
        daily,
        total_events: events?.length ?? 0,
        users: users ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
