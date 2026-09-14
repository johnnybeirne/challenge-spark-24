// Creates and resolves token-based quiz reports for leads who asked for their
// report but did not join the challenge. Runs with the service role so the
// report can be reopened from any device with no login and no 6-digit code.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const rest = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
};

const makeToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 255) : "";
      const assessment = body.assessment && typeof body.assessment === "object" ? body.assessment : {};
      const origin = typeof body.origin === "string" ? body.origin.slice(0, 300) : "";
      if (!name || !email.includes("@")) return json({ error: "Name and a valid email are required" }, 400);

      const token = makeToken();
      const insert = await rest("quiz_reports", {
        method: "POST",
        body: JSON.stringify({ token, name, email, assessment }),
      });
      if (!insert.ok) {
        console.error("quiz-report insert failed", insert.data);
        return json({ error: "Could not save the report" }, 500);
      }

      const link = `${origin || SUPABASE_URL}/r/${token}`;

      if (RESEND_API_KEY) {
        const html = `
          <div style="font-family:Arial,sans-serif;font-size:16px;color:#111">
            <p>Hi ${name.split(" ")[0]},</p>
            <p>Here is your personalised lead generation report. You can open it any time, on any device:</p>
            <p><a href="${link}" style="background:#F57C00;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Open my report</a></p>
            <p style="font-size:13px;color:#555">Or paste this link into your browser:<br>${link}</p>
            <p>Johnny</p>
          </div>`;
        const sent = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Johnny Beirne <johnny@johnnybeirne.com>",
            to: [email],
            subject: "Your lead generation report",
            html,
          }),
        });
        if (!sent.ok) console.error("quiz-report email failed", await sent.text());
      }

      return json({ token, link });
    }

    if (action === "get") {
      const token = typeof body.token === "string" ? body.token.trim() : "";
      if (!token || token.length > 100) return json({ error: "invalid" }, 404);
      const found = await rest(
        `quiz_reports?token=eq.${encodeURIComponent(token)}&select=name,assessment,expires_at&limit=1`,
        { method: "GET" },
      );
      const row = Array.isArray(found.data) ? found.data[0] : null;
      if (!row) return json({ error: "invalid" }, 404);
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        return json({ error: "expired" }, 410);
      }
      await rest(`quiz_reports?token=eq.${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: JSON.stringify({ last_viewed_at: new Date().toISOString() }),
      });
      return json({ name: row.name, assessment: row.assessment });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("quiz-report error", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
