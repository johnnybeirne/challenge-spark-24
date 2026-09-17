import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: authData, error: authError } = await sb.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: allowed, error: roleError } = await sb.rpc("has_role", {
      _user_id: authData.user.id,
      _role: "admin",
    });
    if (roleError || !allowed) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Recent quiz activity, with timestamps, for drop-off tracing
    const { data: quizEvents } = await sb
      .from("analytics_events")
      .select("event_name, metadata, created_at")
      .in("event_name", [
        "assessment_started",
        "assessment_question_answered",
        "assessment_completed",
      ])
      .order("created_at", { ascending: false })
      .limit(3000);

    // Server-side quiz sessions: start time, last question reached, completion
    const { data: quizSessions } = await sb
      .from("quiz_sessions")
      .select(
        "session_key, user_id, started_at, last_answered_at, completed_at, last_question_index, last_question_id, answered_count, total_questions, score, level",
      )
      .order("started_at", { ascending: false })
      .limit(500);

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
        quiz_events: quizEvents ?? [],
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
