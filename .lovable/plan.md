

## Goal
Let you set the "Next Live Group Q&A" date from the Owner Console CMS, and have the landing-page banner show that date (or fall back to "[Date TBC]" when it's empty).

## Changes

### 1. Database (migration)
Add a `next_qa_date` column (`timestamptz`, nullable) to the existing `copilot_config` table. Nullable so blank = "[Date TBC]".

### 2. Owner Console CMS — `src/components/cms/CmsCopilot.tsx`
Add a new card **"Next Live Group Q&A date"** with a Shadcn date picker (Popover + Calendar) and a "Clear" button. Persist `next_qa_date` alongside the existing config save.

### 3. Landing page — `src/pages/Landing.tsx`
- On mount, fetch `next_qa_date` from `copilot_config`.
- In the banner, show the formatted date (e.g. "Thu 14 May, 7:00 PM") if set, otherwise show "[Date TBC]".
- Use `date-fns` `format` (already a dependency).

## Out of scope
- No timezone selector — uses the browser's local timezone for display.
- No recurring schedule — single date only.

