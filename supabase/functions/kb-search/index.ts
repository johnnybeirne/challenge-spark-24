import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface KbDoc {
  slug: string;
  title: string;
  content: string;
  tags: string[];
  stage: string;
  source: string | null;
}

function buildTsQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8)
    .map((w) => `${w}:*`)
    .join(" | ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, stage, limit = 4 } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const tsq = buildTsQuery(query);
    const stageList = stage && stage !== "all" ? [stage, "all"] : null;

    let docs: KbDoc[] = [];

    if (tsq) {
      let req1 = sb
        .from("kb_documents")
        .select("slug,title,content,tags,stage,source")
        .eq("is_active", true)
        .textSearch("search_tsv", tsq, { type: "websearch", config: "english" })
        .limit(limit);
      if (stageList) req1 = req1.in("stage", stageList);
      const { data, error } = await req1;
      if (error) console.error("kb fts error:", error);
      docs = data ?? [];
    }

    // Fallback: simple ilike on title if FTS produced nothing
    if (docs.length === 0) {
      let req2 = sb
        .from("kb_documents")
        .select("slug,title,content,tags,stage,source")
        .eq("is_active", true)
        .ilike("title", `%${query.split(" ")[0] ?? query}%`)
        .limit(limit);
      if (stageList) req2 = req2.in("stage", stageList);
      const { data } = await req2;
      docs = data ?? [];
    }

    return new Response(JSON.stringify({ docs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("kb-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
