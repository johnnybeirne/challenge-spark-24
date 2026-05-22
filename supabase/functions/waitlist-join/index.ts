import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function clean(s: unknown, max = 120): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  if (ip) return ip;
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const first_name = clean(body.first_name, 80);
    const surname = clean(body.surname, 80);
    const emailRaw = clean(body.email, 255);
    const referred_by_code = clean(body.referred_by_code, 32);

    if (!first_name || !surname) {
      return new Response(JSON.stringify({ error: "First name and surname are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!emailRaw || !isEmail(emailRaw)) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = emailRaw.toLowerCase();
    const name = `${first_name} ${surname}`.trim();
    const ip = getIp(req);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    const { data, error } = await sb
      .from("waitlist_signups")
      .insert({
        email,
        name,
        first_name,
        surname,
        referral_code: code,
        referred_by_code: referred_by_code || null,
        signup_ip: ip,
      })
      .select()
      .single();

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        const { data: existing } = await sb
          .from("waitlist_signups")
          .select("*")
          .eq("email", email)
          .single();
        return new Response(JSON.stringify({ existing }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("waitlist insert failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("waitlist-join error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
