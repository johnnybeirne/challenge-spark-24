The mismatch is real: the editor is showing the **Authority** section, while the visible preview is currently scrolled to the **Hero** section. The data is wired, but the editor gives no clear page-position context, so it looks like unrelated text should be controlling the circled headline.

Plan:

1. **Make each CMS section identify its live page area**
   - Rename section headers and field labels so they map to what users see, e.g.:
     - Hero: Eyebrow, Main headline, Supporting text, Primary button
     - Authority: Authority card title, Authority card body
     - FAQ: Question 1, Answer 1, etc.
   - Add a small “Appears in preview as…” hint per section so users know what part of the page they are editing.

2. **Sync preview scroll to the selected editor section**
   - Add stable anchors/data attributes to Landing sections: hero, problem, reveal, score, benefits, authority, faq, cta.
   - When an editor accordion section opens or is selected, reload/point the iframe to `/#section-id` so the preview jumps to the matching part of the page.
   - This means opening **Authority** will show the Authority card, not the top Hero headline.

3. **Improve the split editor UX**
   - Add a “Editing: Landing / Hero” or “Editing: Landing / Authority” indicator above the preview.
   - Keep desktop/mobile/reload controls as-is.
   - Preserve saving behavior and the existing live page rendering.

4. **Clean up unused/duplicated preview code if safe**
   - The standalone `CmsPreviewPane` exists but the current page uses its own iframe. I’ll either reuse it or leave it alone if changing it would create unnecessary scope.

Validation:
- Open Content Editor → Landing.
- Select Hero and confirm preview shows the top headline.
- Select Authority and confirm preview scrolls to the Authority card.
- Confirm edits still save and refresh the preview.