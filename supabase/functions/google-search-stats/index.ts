import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get("Authorization") ?? "";

    const { data: authData, error: authError } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const { data: allowed, error: roleError } = await sb.rpc("has_role", {
      _user_id: authData.user.id,
      _role: "admin",
    });
    if (roleError || !allowed) return json({ error: "Admin access required" }, 403);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const connectionApiKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    if (!lovableApiKey || !connectionApiKey) {
      return json({ error: "Google Search Console is not connected" }, 400);
    }
    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": connectionApiKey,
    };

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const startDate: string = typeof body.startDate === "string" ? body.startDate : isoDaysAgo(28);
    const endDate: string = typeof body.endDate === "string" ? body.endDate : isoDaysAgo(1);
    const requestedSite: string | undefined =
      typeof body.siteUrl === "string" && body.siteUrl.length > 0 ? body.siteUrl : undefined;

    // 1. List verified properties
    const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!sitesRes.ok) {
      const details = await sitesRes.text();
      console.error(`List properties failed [${sitesRes.status}]: ${details}`);
      return json({ error: "Could not list Search Console properties", status: sitesRes.status, details }, sitesRes.status);
    }
    const { siteEntry = [] } = (await sitesRes.json()) as { siteEntry?: SiteEntry[] };
    const verified = siteEntry.filter((e) => e.permissionLevel !== "siteUnverifiedUser");
    if (verified.length === 0) return json({ error: "No verified Search Console property available" }, 400);

    let siteUrl = verified[0].siteUrl;
    if (requestedSite) {
      const match = verified.find((e) => e.siteUrl === requestedSite);
      if (!match) return json({ error: "That Search Console property is not verified for this account" }, 400);
      siteUrl = match.siteUrl;
    }

    const query = async (dimensions: string[], rowLimit: number) => {
      const res = await fetch(
        `${GATEWAY}/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
        },
      );
      if (!res.ok) {
        const details = await res.text();
        console.error(`Search analytics query failed [${res.status}]: ${details}`);
        throw new Error(`[${res.status}]: ${details}`);
      }
      const data = (await res.json()) as { rows?: Array<{ keys: string[]; clicks: number; impressions: number; ctr: number; position: number }> };
      return data.rows ?? [];
    };

    const [queries, pages, days, countries, devices] = await Promise.all([
      query(["query"], 25),
      query(["page"], 25),
      query(["date"], 120),
      query(["country"], 10),
      query(["device"], 5),
    ]);

    const totals = days.reduce(
      (acc, r) => {
        acc.clicks += r.clicks;
        acc.impressions += r.impressions;
        return acc;
      },
      { clicks: 0, impressions: 0 },
    );
    const weightedPosition =
      days.length > 0 && totals.impressions > 0
        ? days.reduce((s, r) => s + r.position * r.impressions, 0) / totals.impressions
        : 0;

    return json({
      siteUrl,
      properties: verified.map((e) => e.siteUrl),
      range: { startDate, endDate },
      totals: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
        position: weightedPosition,
      },
      queries,
      pages,
      days,
      countries,
      devices,
      refreshedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("google-search-stats error:", message);
    return json({ error: "Google Search Console request failed", details: message }, 500);
  }
});

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
