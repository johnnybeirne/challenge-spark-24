import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_SUBJECT = "Your sign-in code: {code}";
const DEFAULT_BODY = `<p>Hi,</p>
<p>Here is your sign-in code:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;">{code}</p>
<p>Enter this code on the page you came from. It expires shortly.</p>
<p>If you didn't request this, you can ignore this email.</p>`;

async function loadCopy(): Promise<{ subject: string; body: string }> {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data } = await supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "auth")
      .eq("section", "auth_email");
    const v: Record<string, string> = {};
    for (const r of data ?? []) v[r.key] = r.value;
    return {
      subject: (v.subject || "").trim() || DEFAULT_SUBJECT,
      body: (v.body || "").trim() || DEFAULT_BODY,
    };
  } catch (_e) {
    return { subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: { http_code: 500, message: "RESEND_API_KEY is not configured" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!HOOK_SECRET) {
    return new Response(JSON.stringify({ error: { http_code: 500, message: "SEND_EMAIL_HOOK_SECRET is not configured" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let parsed: {
    user: { email: string };
    email_data: { token: string; email_action_type: string };
  };

  try {
    const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));
    parsed = wh.verify(payload, headers) as typeof parsed;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response(JSON.stringify({ error: { http_code: 401, message: "Invalid signature" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = parsed?.user?.email;
  const code = parsed?.email_data?.token ?? "";
  if (!email) {
    return new Response(JSON.stringify({ error: { http_code: 400, message: "Missing user email" } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const copy = await loadCopy();
  const subject = copy.subject.replaceAll("{code}", code);
  const html = copy.body.replaceAll("{code}", code);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Johnny Beirne <johnny@johnnybeirne.com>",
      to: [email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error(`Resend error [${res.status}]: ${details}`);
    return new Response(JSON.stringify({ error: { http_code: res.status, message: details } }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
