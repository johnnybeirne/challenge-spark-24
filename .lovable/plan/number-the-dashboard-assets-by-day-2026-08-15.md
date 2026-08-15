# Number the dashboard assets by day

Right now the Your Assets list mixes two label styles: the roadmap says "Asset 1", the promise says "Day 1", and the quiz says "Asset 2". Numbering runs straight through instead of restarting per day, and the asset names are small.

## What changes

Every asset card gets one consistent label line, with the day first and the number restarting inside each day:

```text
DAY 1 · ASSET 1     Your Roadmap
DAY 1 · ASSET 2     Your Challenge Promise
DAY 2 · ASSET 1     Your Quiz
```

- The roadmap becomes Day 1, Asset 1.
- The challenge promise becomes Day 1, Asset 2 (it currently shows only "Day 1" with no number).
- The quiz becomes Day 2, Asset 1 (it currently shows "Asset 2").
- As more assets are added later, each new day starts again at Asset 1.

The asset name under the label gets a bigger, bolder heading so each card reads as its own item, with the label line kept small and uppercase above it. Card layout, links, download buttons and the promise text itself stay as they are.

## Owner editable copy

The day and asset numbers are derived from where the asset sits in the sequence, so they stay correct without editing. The asset titles and descriptions stay owner editable through the existing dashboard CMS content, with the label keys tidied so each card uses the same naming pattern.

## Technical notes

- Single file: `src/components/DashboardAssetsSection.tsx`.
- Introduce a small local list of asset entries, each with its day, its title/copy content keys, and its body renderer. The badge string is computed from position within the day, so no per card hardcoded numbers.
- Heading size moves from `--body-size` bold to `text-lg` bold; badge line stays at 11px uppercase in the primary colour.
- One small content update so the existing promise badge key no longer holds the raw text "Day 1" duplicated by the new label.
