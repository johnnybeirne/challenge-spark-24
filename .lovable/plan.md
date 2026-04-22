

## Goal
Stop the AI co-pilot from generating live answers via Google Gemini. Instead, serve only canned Q&A pairs that you manage in the CMS. If the user's question matches one of your CMS entries, return that answer; otherwise show a friendly fallback message.

## What changes for the user
- **Admin CMS** (`/admin/cms` → Co-pilot section): you get a new "Q&A library" editor where you add question/answer pairs. Each row has a question (or trigger keywords) and the exact answer to return.
- **Chat behavior**: replies are pulled only from your library. No more invented Day 1 frameworks, no more model hallucinations. If nothing matches, the chat says something like "I don't have an answer for that yet — try one of the suggested questions."
- **System prompt** field becomes obsolete and is hidden from the CMS (kept in the DB for now, just unused).

## How it works
1. New table `copilot_qa` stores the Q&A library (question, answer, keywords, sort_order, is_active).
2. The `copilot` edge function is rewritten: it no longer calls the Lovable AI gateway. It loads all active Q&A rows and runs simple matching:
   - Exact match on question (case-insensitive) wins.
   - Otherwise, score by keyword overlap and pick the best match above a small threshold.
   - If nothing matches, return the configured fallback message.
3. CMS gets a new card to add/edit/delete Q&A entries (question, answer, optional comma-separated keywords).
4. Starter questions in the CMS already drive the quick-tap chips — those will now naturally map 1:1 to entries in the Q&A library, so tapping a starter always returns its paired answer.

## Technical details
- **DB migration**: create `public.copilot_qa` (id, question text, answer text, keywords text[], sort_order int, is_active bool, timestamps). RLS: anyone can SELECT active rows; only admins can INSERT/UPDATE/DELETE. Add `fallback_message` text column to `copilot_config` (default: "I don't have an answer for that yet. Try one of the suggested questions below.").
- **Edge function** `supabase/functions/copilot/index.ts`: remove the `fetch` call to `ai.gateway.lovable.dev`. Load `copilot_qa` rows + `copilot_config.fallback_message`. Matching algorithm:
  1. Normalize prompt (lowercase, trim, strip punctuation).
  2. Exact question match → return its answer.
  3. Keyword scoring: count how many keywords from each row appear in the prompt; pick highest score ≥ 1.
  4. No match → return fallback message.
  Response shape stays `{ response: string }` so the chat UI doesn't change.
- **CMS** `src/components/cms/CmsCopilot.tsx`: hide the system prompt card; add a new "Fallback message" field and a "Q&A library" card with add/edit/delete rows (question, answer textarea, keywords input). Persist via standard supabase insert/update/delete on `copilot_qa`.
- **Chat UI** `src/components/AiCopilotChat.tsx`: no changes needed — it already calls the edge function and renders `{ response }`. Typewriter effect remains.
- **Note**: `LOVABLE_API_KEY` becomes unused by this function but stays in secrets (other features may use it).

## Out of scope
- No fuzzy/semantic matching (no embeddings). Keyword + exact match only — keeps it predictable and free.
- Existing `system_prompt` column stays in DB but is no longer read or shown in CMS.

