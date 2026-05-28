Wrap the dynamic choice values in the Day 1 Step 7 summary headline with curly double quotes so it's clear they're the user's selections.

**File:** `src/components/Day1Setup.tsx` (lines 471–475)

**Change:**
```tsx
<h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
  You're building a{" "}
  <span className="text-primary">“{challengeLabel(challengeType)}”</span> challenge for{" "}
  <span className="text-primary">“{audienceLabelShort(audienceType)}”</span>
</h2>
```

Result reads: You're building a "learn a skill" challenge for "businesses".

No other copy, layout, or logic changes.