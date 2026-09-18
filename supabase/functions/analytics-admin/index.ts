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

    // Get events from the last 180 days. PostgREST caps a single response at
    // 1000 rows, so page through until everything in the window is loaded.
    const sinceIso = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const rawEvents: any[] = [];
    const PAGE = 1000;
    for (let page = 0; page < 60; page++) {
      const { data: chunk, error } = await sb
        .from("analytics_events")
        .select("event_name, created_at, metadata")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      if (!chunk || chunk.length === 0) break;
      rawEvents.push(...chunk);
      if (chunk.length < PAGE) break;
    }

    // The owner's own browsing is flagged internal and excluded.
    const events = rawEvents.filter(
      (e: any) => e?.metadata?.internal !== true,
    );

    // Count by event
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.event_name] = (counts[e.event_name] || 0) + 1;
    }

    // Daily breakdown
    const daily: Record<string, Record<string, number>> = {};
    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      if (!daily[day]) daily[day] = {};
      daily[day][e.event_name] = (daily[day][e.event_name] || 0) + 1;
    }

    // Unique-visitor breakdown: one browser counts once per day per event.
    // Older rows carry no visitor id, so they fall back to counting the row.
    const dailyVisitorSets: Record<string, Record<string, Set<string>>> = {};
    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      const visitor = (e as any)?.metadata?.visitor_id;
      const key = typeof visitor === "string" && visitor
        ? visitor
        : `row:${day}:${e.event_name}:${Math.random()}`;
      dailyVisitorSets[day] = dailyVisitorSets[day] ?? {};
      dailyVisitorSets[day][e.event_name] =
        dailyVisitorSets[day][e.event_name] ?? new Set<string>();
      dailyVisitorSets[day][e.event_name].add(key);
    }
    const dailyUnique: Record<string, Record<string, number>> = {};
    const countsUnique: Record<string, number> = {};
    const allVisitorSets: Record<string, Set<string>> = {};
    for (const [day, byEvent] of Object.entries(dailyVisitorSets)) {
      dailyUnique[day] = {};
      for (const [event, set] of Object.entries(byEvent)) {
        dailyUnique[day][event] = set.size;
        allVisitorSets[event] = allVisitorSets[event] ?? new Set<string>();
        for (const v of set) allVisitorSets[event].add(v);
      }
    }
    for (const [event, set] of Object.entries(allVisitorSets)) {
      countsUnique[event] = set.size;
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

    // Challenge participants: current day and completed-day timestamps
    const { data: challengeProgress } = await sb
      .from("challenge_progress")
      .select("user_id, current_day, day_completed_at, completed, started_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000);

    // User list with referral data
    const { data: users } = await sb
      .from("profiles")
      .select("user_id, name, email, invite_code, referred_by, direct_referral_count, indirect_referral_count, created_at")
      .order("created_at", { ascending: false });

    return new Response(
      JSON.stringify({
        counts,
        daily,
        counts_unique: countsUnique,
        daily_unique: dailyUnique,
        total_events: events.length,
        users: users ?? [],
        quiz_events: quizEvents ?? [],
        quiz_sessions: quizSessions ?? [],
        challenge_progress: challengeProgress ?? [],
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
