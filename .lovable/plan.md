

## Prompt 33 — CMS Gap Analysis and Completion Plan

Prompt 33 was **already implemented** in a previous session. The full infrastructure exists: `SiteConfigContext` with all 10 config sections, `AdminCms` page with sidebar at `/owner-console/cms`, all 10 editor components (`CmsLanding`, `CmsAssessment`, `CmsChallenge`, etc.), localStorage persistence with deep merge, and Landing page integration.

### What's Already Done
- SiteConfig interface with all types and defaults
- SiteConfigProvider with localStorage persistence and deep merge
- All 10 CMS editor panels built and functional
- Route at `/owner-console/cms` with password auth
- Landing page reads from config context

### Gaps to Close

**1. CmsLanding — Missing date picker for countdown target**
- Add a date picker field for `countdownTarget` (currently `null`, no UI to set it)
- Add custom URL option to CTA link dropdowns (currently only `/assess` and `/join`)

**2. CmsAssessment — Empty questions array**
- The `questions` array defaults to `[]`. Populate with the 8 default assessment questions so the owner can edit them from the CMS.

**3. CmsPartners — Missing founding cutoff date picker**
- Add date picker for `foundingCutoffDate` field (exists in config but no UI)

**4. CmsGlobal — Missing data management buttons**
- Add "Export all user data" button (export all `challengeos_*` localStorage keys)
- Add "Export analytics events" button
- Add "Clear all user data" button with double confirmation dialog

**5. Mobile responsiveness**
- CMS sidebar is fixed `w-56` — add responsive behavior so on mobile it collapses to a dropdown/sheet

**6. Unsaved changes indicator**
- Add subtle visual indicator when the draft differs from saved config (e.g., dot on the Save button or yellow border)

### Files to Modify
- `src/components/cms/CmsLanding.tsx` — date picker + custom URL
- `src/context/SiteConfigContext.tsx` — populate default questions
- `src/components/cms/CmsPartners.tsx` — date picker for cutoff
- `src/components/cms/CmsGlobal.tsx` — data export/clear buttons
- `src/pages/AdminCms.tsx` — mobile responsive sidebar

### No new files needed. No structural changes. All additions are incremental enhancements to existing components.

