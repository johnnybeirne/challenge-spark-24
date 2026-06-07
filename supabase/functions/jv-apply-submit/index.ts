import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Johnny Beirne <johnny@johnnybeirne.com>";

const LIST_SIZES = new Set(["Under 500", "500 to 1k", "1k to 5k", "5k to 10k", "10k plus"]);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

interface Payload {
  full_name: string;
  email: string;
  list_size: string;
  product_name: string;
  product_url?: string;
  retail_value: number; // dollars
}

async function fetchCms(supa: ReturnType<typeof createClient>) {
  const { data } = await supa
    .from("site_content")
    .select("section,key,value")
    .eq("page", "jv-apply");
  const m: Record<string, string> = {};
  for (const r of (data ?? []) as { section: string; key: string; value: string }[]) {
    m[`${r.section}.${r.key}`] = r.value;
  }
  return m;
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      reply_to: replyTo || undefined,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Resend error", res.status, txt);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<Payload>;

    // Validation
    const fullName = (body.full_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const listSize = (body.list_size || "").trim();
    const productName = (body.product_name || "").trim();
    const productUrl = (body.product_url || "").trim();
    const retail = Number(body.retail_value);

    if (!fullName || fullName.length > 200)
      return json({ error: "Full name is required" }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
      return json({ error: "Valid email is required" }, 400);
    if (!LIST_SIZES.has(listSize))
      return json({ error: "Invalid list size" }, 400);
    if (!productName || productName.length > 200)
      return json({ error: "Paid product name is required" }, 400);
    if (productUrl) {
      if (productUrl.length > 500 || !/^https?:\/\//i.test(productUrl))
        return json({ error: "Product URL must start with http(s)://" }, 400);
    }
    if (!Number.isFinite(retail) || retail < 0 || retail > 1_000_000)
      return json({ error: "Retail value is required" }, 400);

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const { error: insertError } = await supa.from("jv_applications").insert({
      full_name: fullName,
      email,
      list_size: listSize,
      product_name: productName,
      product_url: productUrl || null,
      retail_value_cents: Math.round(retail * 100),
    });
    if (insertError) {
      console.error("Insert error", insertError);
      return json({ error: "Could not save application" }, 500);
    }

    // CMS-driven email content
    const cms = await fetchCms(supa);
    const adminTo = cms["email.admin_notify_to"] || "johnny@johnnybeirne.com";
    const subject =
      cms["email.confirm_subject"] || "We received your JV partner application";
    const bodyTpl =
      cms["email.confirm_body"] ||
      "Hi {{name}},\n\nThanks for applying. We'll be in touch shortly.";

    const filledBody = bodyTpl
      .replaceAll("{{name}}", fullName)
      .replaceAll("{{product_name}}", productName);
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#111">${esc(
      filledBody,
    )
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br />")}</p>`)
      .join("")}</div>`;

    // Applicant confirmation
    await sendEmail(email, subject, html);

    // Admin notification
    const adminHtml = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
        <h2 style="margin:0 0 12px">New JV partner application</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><b>Name</b></td><td>${esc(fullName)}</td></tr>
          <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
          <tr><td><b>List size</b></td><td>${esc(listSize)}</td></tr>
          <tr><td><b>Product</b></td><td>${esc(productName)}</td></tr>
          <tr><td><b>URL</b></td><td>${productUrl ? esc(productUrl) : "—"}</td></tr>
          <tr><td><b>Retail value</b></td><td>$${retail.toLocaleString()}</td></tr>
        </table>
      </div>`;
    await sendEmail(
      adminTo,
      `New JV application: ${fullName} — ${productName}`,
      adminHtml,
      email,
    );

    return json({ success: true });
  } catch (err) {
    console.error("jv-apply-submit error", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
