## Goal
Add small `?` icons next to the quiz hero **headline** and **subheading** on the playable quiz screen. Hovering (or tapping) shows a tooltip with advice. The advice text is editable from a new admin page.

## What to build

### 1. New DB table: `quiz_preview_tips`
Single-row-per-key key/value store, scoped to two keys: `hero_headline`, `subheading`.

```sql
create table public.quiz_preview_tips (
  key text primary key,           -- 'hero_headline' | 'subheading'
  tip text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.quiz_preview_tips to anon, authenticated;
grant all on public.quiz_preview_tips to service_role;
alter table public.quiz_preview_tips enable row level security;
create policy "public read" on public.quiz_preview_tips for select using (true);
create policy "admin write" on public.quiz_preview_tips for all
  to authenticated using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
```
Seed both rows with sensible default copy.

### 2. New hook: `src/hooks/useQuizPreviewTips.ts`
Fetches both rows once, returns `{ heroHeadline: string, subheading: string, loading }`. Falls back to empty strings (icon hidden when empty).

### 3. UI change: `src/components/Day2QuizPlayable.tsx`
Next to the hero headline (line ~277) and subheading (line ~273), render an inline `<HelpTip text={...} />` — a small `HelpCircle` icon from lucide-react inside a shadcn `Tooltip` (with `TooltipProvider`). Visible to all users. If the tip string is empty, render nothing.

Create a tiny shared component `src/components/HelpTip.tsx` so we can reuse it.

### 4. New admin page: `src/pages/AdminQuizPreviewTips.tsx`
- Two `EditableField` (multiline) inputs from `cms-ui.tsx`: "Hero headline tip" and "Subheading tip", each with a helper sentence describing where it appears.
- `StickyActionBar` to save (upserts both rows).

Route: add `/owner-console/quiz-preview-tips` in `src/App.tsx`.

Sidebar entry in `src/components/admin/AdminSidebar.tsx`: **"Quiz preview tips"** (icon: `HelpCircle`), placed near "User quiz preview".

## Out of scope
- No changes to the headline/subheading copy itself or to the AI generation pipeline.
- No tooltips on the CTA, sticky bar, or question cards (per your selection).
