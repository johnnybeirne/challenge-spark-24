import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    let token: string | null = null;
    if (req.method === "GET") {
      const url = new URL(req.url);
      token = url.searchParams.get("token");
    } else {
      const body = await req.json().catch(() => ({}));
      token = body?.token ?? null;
    }
    if (!token || token.length < 8) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row } = await admin
      .from("newsletter_unsubscribe_tokens").select("email").eq("token", token).maybeSingle();

    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: "Token not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Validate only — do not unsubscribe yet (so previews don't trigger opt-out)
      const { data: existing } = await admin
        .from("newsletter_suppressions").select("id").eq("email", row.email).maybeSingle();
      return new Response(JSON.stringify({ ok: true, email: row.email, alreadyUnsubscribed: !!existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST → confirm unsubscribe
    await admin.from("newsletter_suppressions").upsert(
      { email: row.email },
      { onConflict: "email" },
    );

    return new Response(JSON.stringify({ ok: true, email: row.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("newsletter-unsubscribe error:", err);
    return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
