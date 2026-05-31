# Option C — Smart-formatted, bold/colored echoes with inline edit

All changes in `src/components/Day1Setup.tsx`. No backend, scoring, sequencing, or state-shape changes.

## 1. New helper `formatList(raw: string): string`

Normalises a freeform list answer so Johnny doesn't echo "speakers trainers authors coaches" verbatim.

- Lowercase, trim, strip trailing punctuation.
- Split on commas, `/`, ` and `, ` & `, and runs of 2+ spaces.
- Drop empty parts, dedupe (case-insensitive), keep order.
- Re-join:
  - 1 item → as-is
  - 2 → `"a and b"`
  - 3+ → `"a, b, c, and d"` (Oxford comma)
- If the original looks like a sentence (contains a verb-ish word, length > 60 chars, or only 1 token after split), return it untouched.

Used to clean `audience`, optionally `how` (only when it parses as a list).

## 2. New `EchoText` component

Renders an echoed snippet bold + accent-coloured with a tiny pencil affordance.

```
<EchoText value={audience} onSave={(v) => { setAudience(v); persistFoundation({ audience: v }); }} />
```

Behavior:
- Idle: `<span class="font-semibold text-primary">{formatList(value)}</span>` followed by a small `Pencil` icon button (ghost, size-3, `text-muted-foreground hover:text-primary`).
- Click pencil → swap to an inline `<input>` (auto-width, same styling, same accent border) with Save / Cancel (Enter / Esc).
- On Save: call `onSave(newValue)`, exit edit mode. Updates flow into existing state setters and `persistFoundation`, so every later echo updates too.
- Visual: bold + `text-primary`, no underline, no background — matches Johnny's chat tone.

## 3. Extend message rendering to support inline echo segments

Change message type from `string` to `string | Array<string | { echo: 'audience' | 'how' | 'problem' | 'outcome' | 'topic' }>`.

- `StaticAi`: when a message is an array, map segments — strings render plain; `{echo}` segments render `<EchoText>` wired to the matching setter.
- `TypedSequence`: for typing, flatten segments to plain text (using `formatList` for echoes) and type as today. Once a message finishes typing and moves into `shown`, re-render it from segments so the styled `EchoText` (with pencil) replaces the plain typed string. Net effect: the echo types in cleanly, then "settles" into bold/accent with a pencil — no jarring reflow because the text content is identical.

This keeps the typing animation intact and only upgrades the final rendered state.

## 4. Wire echoes at every Day 1 touchpoint

Replace the manual `${audienceLower}` / `${whoLower}` / `${howLower9}` substitutions with echo segments:

- **Step 2** (problem prompt): `"…for "`, `{echo:'audience'}`, `"…"` — echo audience.
- **Step 3** (how prompt): echo audience.
- **Step 5** (challenge selection greeting — the screenshot you sent): `"Great, Johnny. With "`, `{echo:'audience'}`, `" in mind, what will your 3-day challenge help them achieve?"`
- **Step 6 intro line** (still there): echo audience and the challenge label.
- **Step 9** (outcome prompt): echo audience and `how` (the "Love it — using …" callback uses `formatList(how)`).
- **Step 7 promise summary**: echo audience, problem, how, outcome — these are the highest-value echoes; pencil here lets the user fix a typo before the Promise card locks in.

`formatList` only meaningfully changes list-style answers (e.g. audience). Single-sentence answers (problem, outcome) pass through unchanged.

## 5. Edit safety

- Edits only affect the same fields already persisted by the foundation handlers — no new persistence path, no scoring side effects.
- After an edit on step 7, the Challenge Promise card recomputes from the updated state on next render (already does, since it reads from `audience` / `problem` / `how` / `outcome`).
- No AI re-call on edit (cheap, avoids latency). The AI-generated reaction (`step3Reaction`) and promise (`step7Promise`) keep whatever wording they had; only the visible echoed substrings update. Acceptable because echoes are short surface tokens, not full sentences.

## Out of scope

- A full confirm-and-edit step (Option B) — explicitly skipped.
- Re-running the `day1-thread` edge function on edits.
- Restyling other UI elements; only the echoed substrings change.

## Verification

- Walk steps 1 → 7, entering messy lists ("speakers trainers, authors and coaches") and confirm Johnny says "speakers, trainers, authors, and coaches".
- Click the pencil on step 7, change "coaches" to "consultants", confirm the Promise card updates.
- No TypeScript errors.
