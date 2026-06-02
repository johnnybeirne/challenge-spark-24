import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    let token: string | null = null;
    let action: string | null = null;
    let reason: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      token = url.searchParams.get("token");
    } else {
      const body = await req.json().catch(() => ({} as any));
      token = body?.token ?? null;
      action = body?.action ?? null;
      reason = typeof body?.reason === "string" ? body.reason : null;
    }
    if (!token || token.length < 8) return json({ ok: false, error: "Invalid token" }, 400);

    const { data: row } = await admin
      .from("newsletter_unsubscribe_tokens").select("email").eq("token", token).maybeSingle();
    if (!row) return json({ ok: false, error: "Token not found" }, 404);

    if (req.method === "GET") {
      const [{ data: existing }, { data: config }] = await Promise.all([
        admin.from("newsletter_suppressions").select("id").eq("email", row.email).maybeSingle(),
        admin.from("unsubscribe_page_config").select("*").eq("id", 1).maybeSingle(),
      ]);
      return json({
        ok: true,
        email: row.email,
        alreadyUnsubscribed: !!existing,
        config: config ?? null,
      });
    }

    // POST — resubscribe
    if (action === "resubscribe") {
      await admin.from("newsletter_suppressions").delete().eq("email", row.email);
      return json({ ok: true, resubscribed: true, email: row.email });
    }

    // POST — confirm unsubscribe (+ optional feedback)
    await admin.from("newsletter_suppressions").upsert(
      { email: row.email },
      { onConflict: "email" },
    );

    const trimmedReason = (reason ?? "").trim().slice(0, 2000);
    if (trimmedReason) {
      await admin.from("unsubscribe_feedback").insert({ email: row.email, reason: trimmedReason });
    }

    return json({ ok: true, email: row.email });
  } catch (err) {
    console.error("newsletter-unsubscribe error:", err);
    return json({ ok: false, error: "Internal error" }, 500);
  }
});
