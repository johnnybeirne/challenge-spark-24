## Admin CMS — Content & Configuration Control System

### Phase 1: Foundation
1. **Config store** — Create `src/context/SiteConfigContext.tsx` with full `SiteConfig` interface, defaults matching current hardcoded values, localStorage persistence (`challengeos_site_config`), and context provider
2. **Wrap app** in `SiteConfigProvider`

### Phase 2: CMS Page & Layout
3. **Create `/admin/cms` route** with sidebar navigation (10 sections) and main editing area
4. **Admin auth** — reuse existing password gate (`challengeos2024`)
5. **Add "CMS" link** to admin navigation

### Phase 3: CMS Sections (all 10)
Build each section as a separate component with form fields, save button, and toast feedback:
- `CmsLanding` — hero, urgency, promise, social proof, bottom CTA
- `CmsAssessment` — intro, questions, identity types, results text
- `CmsChallenge` — day structure, tasks, completion messages
- `CmsRewards` — challenge rewards, referral rewards, Builder Circle unlock
- `CmsReferrals` — copy, onboarding invite, share channels
- `CmsCommunity` — Builder Circle, leaderboard, activity feed, featured
- `CmsBranding` — colors, layout, app identity
- `CmsPartners` — acquisition page, cross-promo, reward tiers
- `CmsNotifications` — toast messages, empty states
- `CmsGlobal` — cohort, analytics, data management

### Phase 4: Landing Page Integration
6. **Update `Landing.tsx`** to read all text/config from `SiteConfig` context instead of hardcoded strings

### Phase 5: Future (not in this PR)
- Progressively migrate Assessment, Challenge, Rewards, etc. to read from config
- Migrate config to database table when ready

### Notes
- All defaults = current hardcoded values (nothing breaks)
- Components not yet migrated continue working with hardcoded values
- CMS only accessible via `/admin/cms` with password auth
