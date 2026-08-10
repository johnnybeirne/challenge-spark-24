import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CopilotSettings {
  id: string | null;
  page_heading: string;
  page_subheading: string;
  system_prompt: string;
  max_tokens: number;
  fallback_message: string;
}

export const COPILOT_SETTINGS_FALLBACK: CopilotSettings = {
  id: null,
  page_heading: "LeadTree AI",
  page_subheading:
    "Get practical, beginner-friendly help designing, launching, and running your challenge.",
  system_prompt: "",
  max_tokens: 200,
  fallback_message:
    "I couldn't find a matching answer in my library. Try rephrasing your question or tap one of the suggestions below.",
};

export function useCopilotSettings() {
  const [settings, setSettings] = useState<CopilotSettings>(COPILOT_SETTINGS_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase.from("copilot_config") as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setSettings({
          id: data.id ?? null,
          page_heading: data.page_heading || COPILOT_SETTINGS_FALLBACK.page_heading,
          page_subheading:
            data.page_subheading || COPILOT_SETTINGS_FALLBACK.page_subheading,
          system_prompt: data.system_prompt ?? "",
          max_tokens: Number(data.max_tokens) || 200,
          fallback_message:
            data.fallback_message || COPILOT_SETTINGS_FALLBACK.fallback_message,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}
