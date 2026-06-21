// Records a privacy-safe IP fingerprint for the calling user right after
// signup and detects probable restart-fraud (same IP, different email,
// within the last 24h). When a duplicate is detected the freshly-created
// auth user is deleted via the service role so the email is freed up and
// the client can show a friendly error.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Constant pepper — not a real secret, just prevents trivial IP rainbow-table
// reads from a DB dump. Real privacy comes from the sha256 transform.
const IP_PEPPER = "leadio-ip-fp-2026-v1";

function getIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  if (ip) return ip;
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ ok: false, reason: "no_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = getIp(req);
    if (!ip) {
      return new Response(JSON.stringify({ ok: true, recorded: false, reason: "no_ip" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const hash = await sha256Hex(`${IP_PEPPER}:${ip}`);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Look for any other profile with the same hash within the last 24h.
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dups } = await admin
      .from("profiles")
      .select("user_id, email, signup_ip_hashed_at")
      .eq("signup_ip_hash", hash)
      .gte("signup_ip_hashed_at", sinceIso)
      .neq("user_id", user.id)
      .limit(1);

    const duplicate = (dups?.length ?? 0) > 0;

    if (duplicate) {
      // Delete the just-created auth user so the email can be reused
      // (no half-baked accounts left behind) and so they can't slip
      // through with a refresh token from the client.
      await admin.auth.admin.deleteUser(user.id);
      return new Response(
        JSON.stringify({
          ok: true,
          blocked: true,
          reason: "duplicate_ip_24h",
          message: "Another account from this network was created in the last 24 hours.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record the fingerprint on the user's profile.
    await admin
      .from("profiles")
      .update({
        signup_ip_hash: hash,
        signup_ip_hashed_at: new Date().toISOString(),
        suspected_signup_dup_ip: false,
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ ok: true, blocked: false, recorded: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signup-fingerprint error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
