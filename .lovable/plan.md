Goal: stop the logged-in user experience from rendering like a narrow mobile column on desktop, while preserving a clean mobile layout.

Plan:
1. Update the shared app shell/layout so authenticated user routes can expand on desktop instead of being visually constrained to phone width.
2. Change the bottom navigation from a fixed `480px` mobile bar to:
   - full-width on mobile,
   - centered at roughly 90% browser width on desktop,
   - with a sensible max width so it still feels polished.
3. Add a reusable responsive page container style/class for app pages:
   - mobile: comfortable stacked padding,
   - desktop: `width: 90vw`, centered, with larger max width.
4. Apply that responsive desktop width to key user-facing screens, starting with:
   - `/dashboard`
   - `/day/:day`
   - `/unlocks`
   - `/referrals`
   - `/community`
   - partner/user shared app screens where the narrow-column feel is visible.
5. Where pages contain multiple cards, allow desktop layouts to use available space with grids or wider rows where appropriate, without breaking mobile stacking.

Technical notes:
- The current narrow feel is coming mainly from mobile-first containers and nav caps, especially `max-w-[480px]` in `ConsumerNav` / `PromoterNav` and fixed centered page structures.
- I will keep mobile behavior intact, but on desktop the app content will occupy about 90% of the viewport.
- No backend changes are needed.