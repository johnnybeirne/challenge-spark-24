import { supabase } from "@/integrations/supabase/client";
import type { AppState } from "@/context/AppContext";
import type { User } from "@supabase/supabase-js";

/**
 * Snapshots the user's current Leadio state into ai_user_context so every
 * AI surface (copilot, kb-search consumers, future stage-aware functions)
 * has a single source of truth for who the user is and what stage they are in.
 *
 * Best-effort: silently no-ops on failure so it never breaks app flow.
 */
export async function refreshAiContext(authUser: User | null, state: AppState): Promise<void> {
  if (!authUser) return;

  try {
    const challenge = state.challenge;
    const memory = state.memory ?? ({} as AppState["memory"]);
    const assessment = state.assessment;

    const completedModules: string[] = Array.from(
      new Set(
        Object.entries((state as any).training ?? {})
          .filter(([, v]) => v === true)
          .map(([k]) => k),
      ),
    );

    const lastActiveStage = inferStage(state);

    const payload = {
      user_id: authUser.id,
      assessment: (assessment as any) ?? null,
      assessment_type: (assessment as any)?.identityType ?? (assessment as any)?.type ?? null,
      assessment_score: (assessment as any)?.score ?? (assessment as any)?.percent ?? (assessment as any)?.diagnosticScore ?? null,
      weak_dimension: (assessment as any)?.weakDimension ?? (assessment as any)?.lowestDimension ?? null,
      lms_progress: (state as any).training ?? {},
      completed_modules: completedModules,
      challenge_day: challenge?.currentDay ?? null,
      challenge_outputs: challenge?.aiOutputs ?? {},
      build_goal: (memory as any).challengeName ?? (memory as any).desiredOutcome ?? null,
      is_premium: !!(state.user as any)?.isPremium,
      partner_code: (state.user as any)?.partnerCode ?? null,
      referral_count: (state.user as any)?.directReferralCount ?? 0,
      last_active_stage: lastActiveStage,
    };

    await supabase
      .from("ai_user_context")
      .upsert(payload as any, { onConflict: "user_id" });
  } catch (e) {
    // Non-fatal: AI calls degrade gracefully without context.
    console.warn("refreshAiContext failed", e);
  }
}

function inferStage(state: AppState): string {
  if ((state.user as any)?.isPremium) return "premium";
  if (state.challenge?.completed === false && (state.challenge?.currentDay ?? 0) >= 1) return "challenge";
  if ((state as any).training?.hub_completed) return "lms";
  if (state.assessment) return "assessment";
  return "onboarding";
}
