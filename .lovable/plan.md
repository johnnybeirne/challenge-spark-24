## Goal
Add clear visual workflow sections to the client-ready feature overview screens, especially `/admin/features`, so the admin and user journeys are shown as actual flowcharts inside the app.

## What I will change

### 1. Add workflow data to the feature overview model
Extend the existing feature overview data so each overview can include a workflow made of concise steps.

Admin workflow will reflect the built Owner Console flow, for example:

```text
Owner logs into console
  -> Opens overview / analytics / CMS / promoters / activity / features
  -> Reviews performance and users
  -> Updates content or Q&A details
  -> Manages promoters and activity
  -> Copies client-ready feature documentation
```

User workflow will reflect the current built user journey, for example:

```text
Landing page
  -> Discovery assessment
  -> Results and signup
  -> Dashboard
  -> Day 1 / Day 2 / Day 3 tasks
  -> Launch URL submission
  -> Referrals / rewards / Builder Circle unlocks
```

Only existing app capabilities will be shown. Anything incomplete will stay labelled as partial where relevant.

### 2. Add a reusable flowchart component
Create a clean workflow/flowchart component using cards, arrows, and responsive wrapping. It will be readable on desktop and mobile, and match the premium card-based style already used on the feature overview pages.

### 3. Render the flowchart on both overview pages
Update `src/pages/FeatureOverviewPage.tsx` so:
- `/admin/features` includes an "Administrator Workflow" section.
- `/app/features` includes a "User Workflow" section.
- The existing refresh button updates the workflow content along with the feature content.
- The existing copy button includes the workflow steps in the copied text.

### 4. Fix owner-console navigation consistency
Make the Owner Console link point to the same admin feature overview route consistently, so the feature overview with the workflow is easy to find from the sidebar and dashboard.

## Technical details
- Update `src/lib/featureOverview.ts` to add optional workflow steps to `FeatureOverview`.
- Update `overviewToText()` so copied output includes the workflow.
- Update `src/pages/FeatureOverviewPage.tsx` to display the visual workflow.
- Check `src/App.tsx`, `src/components/admin/AdminSidebar.tsx`, and `src/pages/AdminHub.tsx` for route consistency.

## Result
You will have actual in-app flowcharts on the feature overview screens, not just text. `/admin/features` will show the administrator workflow, and `/app/features` will show the user workflow.