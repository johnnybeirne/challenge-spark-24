import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);

    const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey.trim() : "";
    const event = typeof body.event === "string" ? body.event : "";
    if (!sessionKey || sessionKey.length > 128) return json({ error: "Invalid sessionKey" }, 400);
    if (!["start", "answer", "complete"].includes(event)) return json({ error: "Invalid event" }, 400);

    // Optional signed-in user, best effort.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const { data } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    const totalQuestions = Number.isFinite(body.totalQuestions)
      ? Math.max(0, Math.min(200, Math.trunc(body.totalQuestions)))
      : null;

    if (event === "start") {
      await sb.from("quiz_sessions").upsert(
        {
          session_key: sessionKey,
          user_id: userId,
          started_at: new Date().toISOString(),
          total_questions: totalQuestions,
        },
        { onConflict: "session_key", ignoreDuplicates: true },
      );
      return json({ ok: true });
    }

    const { data: existing } = await sb
      .from("quiz_sessions")
      .select("id, answers, answered_count")
      .eq("session_key", sessionKey)
      .maybeSingle();

    if (!existing) {
      await sb.from("quiz_sessions").insert({
        session_key: sessionKey,
        user_id: userId,
        total_questions: totalQuestions,
      });
    }

    if (event === "answer") {
      const questionIndex = Number.isFinite(body.questionIndex)
        ? Math.max(0, Math.min(500, Math.trunc(body.questionIndex)))
        : null;
      const questionId = typeof body.questionId === "string" ? body.questionId.slice(0, 64) : null;
      const answer = typeof body.answer === "string" ? body.answer.slice(0, 500) : null;

      const answers: Record<string, unknown> = { ...((existing?.answers as Record<string, unknown>) ?? {}) };
      if (questionId) answers[questionId] = answer;

      await sb
        .from("quiz_sessions")
        .update({
          user_id: userId ?? undefined,
          last_answered_at: new Date().toISOString(),
          last_question_index: questionIndex,
          last_question_id: questionId,
          answered_count: Object.keys(answers).length,
          answers,
          total_questions: totalQuestions ?? undefined,
        })
        .eq("session_key", sessionKey);

      return json({ ok: true });
    }

    // complete
    const score = Number.isFinite(body.score) ? Math.trunc(body.score) : null;
    const level = typeof body.level === "string" ? body.level.slice(0, 64) : null;

    await sb
      .from("quiz_sessions")
      .update({
        user_id: userId ?? undefined,
        completed_at: new Date().toISOString(),
        score,
        level,
        total_questions: totalQuestions ?? undefined,
      })
      .eq("session_key", sessionKey);

    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
