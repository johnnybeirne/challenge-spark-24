## What's there today

Four pages cover overlapping ground:

| Page | Route(s) | What it shows |
|---|---|---|
| `FeatureOverviewPage` (admin/user modes) | `/owner-console/features`, `/admin/features`, `/app/features` | Generated feature list + workflow chart + journey + snapshot, copy-to-clipboard |
| `Workflow.tsx` | `/workflow` (public) | Cinematic 14-stage user-journey diagram with animations |
| `UserFeaturesAudit.tsx` | `/user-features` | 1,100-line internal audit: every route, role visibility, conflicts |
| `Features.tsx` | — (imported, **never routed**) | Old curated feature catalog with refresh/copy |

Plus AdminHub has a duplicated "Content Editor" card (lines 7–13 and 21–27) and a "Client Feature Overview" card.

These all answer "what does this product do / where does it live?" — just at different fidelity. Worth merging.

## Proposed consolidation

**One admin surface: `/owner-console/overview`** with three tabs:

1. **Features** — current `FeatureOverviewPage` (admin mode), keeps Refresh + Copy.
2. **Workflow** — current `Workflow.tsx` cinematic stages, embedded as a tab (drop public `/workflow` route or redirect it here).
3. **Route audit** — current `UserFeaturesAudit` content (route inventory, role matrix, conflicts).

The public-facing `/app/features` stays (it's user-mode marketing copy) but is the only "outside" surface.

### Route changes

- New: `/owner-console/overview` (tabbed page).
- Redirect: `/owner-console/features` → `/owner-console/overview?tab=features`
- Redirect: `/user-features` → `/owner-console/overview?tab=audit`
- Redirect: `/workflow` → `/owner-console/overview?tab=workflow` (it's currently public but only linked from internal places; if you want to keep it public for sales, say so and I'll leave it).
- Delete: `src/pages/Features.tsx` (unrouted dead code).

### AdminHub cleanup

- Remove the duplicate "Content Editor" card.
- Replace "Client Feature Overview" card with a single "Overview" card pointing at `/owner-console/overview`.
- Sidebar: collapse "User Journey Audit" + "Feature Overview" into one "Overview" entry.

## Files touched

- `src/App.tsx` — new route, redirects, drop dead import.
- `src/pages/AdminOverview.tsx` (new) — tabs wrapper composing the three existing components.
- `src/pages/FeatureOverviewPage.tsx` — keep as-is, used inside tab.
- `src/pages/Workflow.tsx` — keep component, export as tab body (drop its own SEO/full-page chrome when embedded).
- `src/pages/UserFeaturesAudit.tsx` — keep as tab body.
- `src/pages/AdminHub.tsx` — remove duplicate card, rename feature card.
- `src/components/admin/AdminSidebar.tsx` — single "Overview" entry.
- `src/pages/Features.tsx` — delete.
- `src/pages/Links.tsx` — update `/user-features` link.

## Open question before I build

Should `/workflow` stay publicly accessible (it's the cinematic sales-style journey) or move fully behind the admin console? It's not linked from any public nav today, but if it's used in sales/demos I'll keep the public route and just also embed it in the overview tab.