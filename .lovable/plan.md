

## Problem Diagnosis

The **root cause** of the broken layout is in `AppShell.tsx` line 15:

```
<div className="w-full max-w-[480px] relative pb-20">
```

Every page — including the Landing page — is squeezed into a 480px-wide container. The landing page has proper grid layouts, split-screen hero, and 1200px container classes, but they're all trapped inside this mobile-width wrapper. That's why:

- The hero mockups overlap the text (no room for 2 columns)
- Feature cards show one word per line
- The growth loop diagram is cramped
- The final CTA browser mockup is clipped
- Nothing looks like a "desktop layout" despite having `md:` breakpoints

## Plan

### 1. Give the Landing page a full-width layout

The Landing page needs to break out of the 480px constraint. Two changes:

**AppShell.tsx** — Conditionally remove the `max-w-[480px]` wrapper for the landing page. The cleanest approach: create a second `<Route>` layout that wraps Landing in a full-width shell (no `max-w-[480px]`, no bottom nav).

**App.tsx** — Move the Landing route to use a new full-width layout wrapper (or a variant of AppShell with a `fullWidth` prop).

### 2. Fix hero mockup overlap

With the container unconstrained, the existing `md:grid-cols-2` layout will work properly. Minor tweaks:
- Ensure the phone mockup's absolute positioning doesn't bleed over the text column
- Adjust the glow orb position for wider viewports

### 3. Fix final CTA section clipping

The browser mockup at 20% opacity is clipped because the section overflows the 480px box. With full width, this resolves naturally. Will also bump opacity to ~35% so it's actually visible.

### 4. Keep other pages at 480px

Assessment, Results, Dashboard, etc. stay wrapped in the 480px mobile-first container — only the Landing page goes full-width.

---

### Technical Details

**Files to modify:**
- `src/components/AppShell.tsx` — Add a `fullWidth` prop that removes the `max-w-[480px]` class
- `src/App.tsx` — Use `<AppShell fullWidth />` (or a separate wrapper) for the Landing route
- `src/pages/Landing.tsx` — Minor spacing/overlap fixes once the container constraint is removed

