## Dashboard Lead Generation Score Card Cleanup

### Scope
Edit only `src/components/DashboardProfileHeader.tsx` to clean up the score card on the dashboard.

### Changes
1. **Remove the avatar + name block** (lines 94–112):
   - Remove the `<img>` avatar.
   - Remove the "Your profile" label.
   - Remove the user's display name.
2. **Replace the tier/archetype label mapping** with score-based archetypes:
   - `0–35` → **"You're a Pioneer"**
   - `36–74` → **"You're an Architect"**
   - `75–100` → **"You're an Authority"**
3. **Drop the old tier names** (Starter, Builder, Growth Partner, Featured Creator, Strategic Partner) from the mapping entirely.
4. **Preserve untouched**: the numeric score, the progress bar, the accent colors, the bar gradient, and the summary line beneath the bar.

### Technical Details
- The `getTierLabel` function is the only logic that changes.
- The avatar, name, and "Your profile" markup is simply deleted.
- No other files are modified.
- No backend or database changes required.