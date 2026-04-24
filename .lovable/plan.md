Plan to make every font at least 12pt

1. Add a global minimum font-size guard
- Add a base CSS rule so normal text, labels, helper copy, badges, buttons, nav items, table text, form text, chart labels, and small UI text cannot render below 12pt.
- Use 12pt as 16px, which is the browser-equivalent CSS size.
- Keep headings and larger text unchanged.

2. Fix Tailwind small-text defaults
- Update Tailwind’s `xs` text size from its default 12px to 16px so any existing `text-xs` usage becomes compliant automatically.
- Keep `text-sm` at 16px as well, or ensure it is not below the new minimum.
- This avoids manually touching hundreds of existing `text-xs` instances across pages, CMS, admin, rewards, nav, charts, badges, and helper text.

3. Clean up explicit below-minimum sizes
- Search for hard-coded values such as `text-[10px]`, `text-[11px]`, inline `fontSize`, and component-level CSS below 16px.
- Replace them with compliant sizes while preserving visual hierarchy through weight, color, uppercase tracking, spacing, and layout instead of tiny type.

4. Preserve mobile friendliness
- Keep inputs at 16px to prevent mobile browser zoom.
- Review compact areas like bottom navigation, badges, reward cards, tooltips, chart labels, CMS controls, and admin panels so the larger minimum does not cause clipping.

Technical details
- Primary files likely affected:
  - `tailwind.config.ts`
  - `src/index.css`
  - Any components/pages with hard-coded `text-[10px]`, `text-[11px]`, or inline font sizes
- No backend/database changes are needed.
- After implementation, run a project-wide search for below-12pt text classes to confirm none remain.