import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "assessment_started"
  | "assessment_completed"
  | "signup_completed"
  | "day_completed"
  | "challenge_completed"
  | "share_clicked"
  | "referral_sent"
  | "community_unlocked";

export async function trackEvent(
  event: AnalyticsEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await (supabase.from("analytics_events") as any).insert({
      event_name: event,
      metadata: metadata ?? {},
    });
  } catch {
    // Fire-and-forget — never block UI
  }
}
