## The core insight

Step 6 doesn't feel like a repeat because of bad copy — it feels like a repeat because it *is* a repeat. "Who you work with" (step 1) and "who this 3-day challenge is for" (step 6) are functionally the same question for almost every builder. No amount of "zoom in" framing fixes that.

Fix: stop asking about audience twice. Use step 6 to capture something genuinely new that makes the challenge feel real — a specific moment/trigger.

## Changes

### 1. Repurpose step 6 (the big one)

Today step 6 = "describe the specific person" (duplicates step 1).
New step 6 = **"The trigger moment"** — what's happening in their life/business right now that makes this the perfect time for your 3-day challenge?

- Same field (`topicHint`), same position in the flow, same scoring — only the question and placeholder change.
- This gives Johnny a concrete moment to anchor the Challenge Promise around ("when X happens, they need Y") instead of two slightly different audience descriptions.
- Example placeholders, embedding their step-1 audience:
  - solve-problem: *"e.g. They've just realised what they've been doing isn't working and they're ready to try something different — but they don't know what."*
  - quick-win: *"e.g. They've got a deadline or event in 2 weeks and finally need to act on something they've been putting off."*
  - create-asset: *"e.g. They've decided this is the year — they're done winging it and want something solid they can lean on."*
  - reach-milestone: *"e.g. They're close enough to taste it but keep stalling at the same point every time."*

### 2. Add AI at 2 key threading moments (hybrid approach)

A new edge function `day1-thread` calls Lovable AI (`google/gemini-3-flash-preview`, streamed) with the user's actual inputs and returns a short Johnny-voice reaction. Two call sites:

**Moment A — after step 2 (problem)**, before step 3 fires.
Currently step 3 opens cold with "So for X dealing with Y…". Instead, Johnny streams a 1–2 sentence reaction that quotes the user's exact problem language and acknowledges what's hard about it, *then* asks the process question. This is the moment most likely to make the user feel heard.

**Moment B — the Challenge Promise (step 7)**.
Today the promise is a template: `Help {who} move from {pain} to {result} by {how}.` It works but reads stiff. Instead, AI composes:
- A 3–4 sentence summary in Johnny's voice that quotes the user's own words
- A polished one-line Challenge Promise that preserves their exact pain and outcome words
- Falls back to the current template if AI fails — flow is never blocked.

System prompt locks Johnny's voice (warm, direct, Irish-coach plain-speak — matches the existing AI message style), forbids inventing facts, and requires the user's literal pain/outcome words to appear in the output.

### 3. Tighten the existing template threading

Beyond AI, a few cheap wins to make the non-AI moments feel like one conversation:

- **Step 5** (result type): add a one-line callback to the audience above the 4 cards — "*You're building this for [audience]. Here are 4 shapes a 3-day challenge can take — which one fits?*"
- **Step 9** (outcome): currently jumps to "Last one". Add a reactive line that names the process they just described — "*Okay — so you take them through [first ~6 words of `how`]. After 3 days of that, what do they walk away with?*"
- **Back navigation**: when a user goes back and edits an earlier answer, downstream AI messages already re-render via resetKey — no change needed, but I'll verify.

## What stays exactly the same

- Step sequence: 4 → 1 → 5 → 6 → 2 → 3 → 9 → 7 → 8 (unchanged)
- Scoring, unlock logic, analytics events, data shape (`SetupData`)
- Field names — `topicHint` still stores the step-6 answer, just with new meaning
- Step 7 Challenge Promise card layout, gradient, "Continue Building" CTA
- Day 1 reset behaviour and the 24h window

## Technical section

**New edge function**: `supabase/functions/day1-thread/index.ts`
- Verify_jwt = false (public, no user data beyond what's already in their session)
- Accepts `{ moment: "problem-reaction" | "promise", inputs: {...} }`
- Streams SSE response from Lovable AI
- Uses `google/gemini-3-flash-preview` (fast, cheap, good enough for short reactions)
- Returns structured JSON for the promise (via tool calling) so the UI gets `{ summary: string[], promise: string }`
- Handles 429/402 → returns a fallback flag, client uses existing template

**Client integration in `src/components/Day1Setup.tsx`**:
- New state per step: `aiReaction` string + `aiLoading` boolean
- Step 2 → step 3 transition: kick off `day1-thread` call after problem is saved, stream into a Johnny message above the existing step 3 typed message
- Step 7: replace template summary lines with streamed AI output; keep template as fallback
- Cache reactions in `state.challenge.aiOutputs` (existing pattern) so back/forward doesn't re-call

**Step 6 rewrite** (`src/components/Day1Setup.tsx` lines ~1136–1208):
- New `step6Messages` and `placeholderByChallenge` per the copy above
- Reframe `handleTopicNext` profileSaved label from "Client avatar saved" → "Trigger moment saved"
- Update step 7 Challenge Promise to reference the trigger moment in the summary line (e.g. *"This kicks in the moment [trigger]"*)

**No DB migrations, no new packages, no config changes** beyond the new edge function file (which auto-deploys).

## Out of scope

- AI reactions between *every* step (rejected — adds latency to the whole flow for diminishing returns)
- Removing step 6 entirely (would change step count and the existing 24h reset/edit flow)
- Reworking step 8 (AI builder) — it's already AI-driven
