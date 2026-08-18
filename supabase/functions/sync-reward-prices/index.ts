import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REWARDS: { lookupKey: string; name: string; amount: number }[] = [
  { lookupKey: "reward_100", name: "Launch Checklist", amount: 9700 },
  { lookupKey: "reward_300", name: "Referral Templates + JV Bonus", amount: 9700 },
  { lookupKey: "reward_500", name: "Community Feature Spot + JV Bonus", amount: 49700 },
  { lookupKey: "reward_600", name: "Strategy Call Application", amount: 99700 },
  { lookupKey: "reward_700", name: "Done-for-you Funnel + JV Bonus", amount: 99700 },
  { lookupKey: "reward_800", name: "Lifetime Challenge Access", amount: 99700 },
  { lookupKey: "reward_900", name: "Partner Spotlight + JV Bonus", amount: 99700 },
  { lookupKey: "reward_1000", name: "Strategic Partner", amount: 99700 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: authData, error: authError } = await sb.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const { data: allowed, error: roleError } = await sb.rpc("has_role", {
      _user_id: authData.user.id,
      _role: "admin",
    });
    if (roleError || !allowed) return json({ error: "Admin access required" }, 403);

    const body = (await req.json().catch(() => ({}))) as { environment?: StripeEnv };
    const environment = body.environment;
    if (environment !== "sandbox" && environment !== "live") {
      return json({ error: "Invalid environment" }, 400);
    }

    const stripe = createStripeClient(environment);
    const results: {
      lookupKey: string;
      name: string;
      amount: number;
      status: "existing" | "created";
      priceId: string;
    }[] = [];

    for (const reward of REWARDS) {
      const existing = await stripe.prices.list({
        lookup_keys: [reward.lookupKey],
        limit: 1,
      });
      if (existing.data.length) {
        results.push({ ...reward, status: "existing", priceId: existing.data[0].id });
        continue;
      }

      const product = await stripe.products.create({ name: reward.name });
      const price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: reward.amount,
        lookup_key: reward.lookupKey,
        transfer_lookup_key: true,
      });
      results.push({ ...reward, status: "created", priceId: price.id });
    }

    return json({
      environment,
      created: results.filter((r) => r.status === "created").length,
      existing: results.filter((r) => r.status === "existing").length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("sync-reward-prices error:", message);
    return json({ error: message }, 400);
  }
});
