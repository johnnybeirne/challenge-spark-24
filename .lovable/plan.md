## Goal

Text-only copy refresh on `/waitlist`: replace "early access" with "waitlist" language. No layout, styling, logic, or component changes.

## Files

1. **`src/pages/Waitlist.tsx`**
   - Eyebrow chip: "Early access · Pre-launch" → "Waitlist · Pre-launch"
   - Subheadline: "Join early and get priority access when the challenge opens. Invite others to move up the queue." → "Join the waitlist before the challenge opens. Invite others to move up the queue."
   - Primary CTA button: "Join Early Access" → "Join the Waitlist"
   - Loading state stays "Joining…"
   - Trust line: "No spam. Early access only." → "No spam. Waitlist updates only."
   - How it works step 1 title: "Join the list" → "Join the waitlist"
   - How it works step 3 title: "Invite 3 people" → "Invite 3 people to move up the waitlist" (keep the body copy as-is)
   - Success card heading "You're on the list" stays (it's accurate). "We just sent your invite link to {email}. Open it to share with friends and move up the queue." stays.
   - Toasts:
     - "You're in! Check your inbox." stays
     - "You're already on the list — we re-sent your invite link." stays
   - Final CTA headline: "The earlier you join, the stronger your starting position." → "The earlier you join the waitlist, the stronger your starting position."
   - Final CTA button: "Join Early Access" → "Join the Waitlist"
   - SEO title: "Early Access — Leadio" → "Waitlist — Leadio"
   - SEO description: "Join early and get priority access when the 3-day challenge opens. Invite others to move up the queue." → "Join the waitlist for the 3-day challenge. Invite others to move up the queue."

2. **`src/components/WaitlistActivityFeed.tsx`** (the in-page momentum feed)
   - Replace "joined early access" → "joined the waitlist"
   - Replace "unlocked earlier access" → "unlocked earlier entry"
   - Keep "moved up the queue" / "moved up 12 spots" / "invited N people" lines as they already match the spec
   - Keep avatars, timing, count, and animation untouched

## Out of scope

- Email HTML body copy (sent by `send-email`) — not on the page
- Admin pages, schema, components elsewhere
- Any layout, styling, animation, or logic changes
