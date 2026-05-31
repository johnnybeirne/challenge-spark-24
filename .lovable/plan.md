## Problem
In `src/components/Day1Setup.tsx`, steps 2, 3, and 9 echo the user's previous answers back as an italic recap line above the next question (e.g. "Helping {who} overcome {pain} via {how}."). Because the recap just stitches raw user input together with hardcoded connector words ("Helping", "overcome", "via"), any non-noun-phrase answer produces broken grammar like:

> "Helping they just don't know have enough time in the day."

## Decision
Drop the recaps entirely. Rewriting them on the fly would require an AI call per keystroke for cosmetic text that adds no real value — the user's previous answers are already visible in the chat history above.

## Change
In `src/components/Day1Setup.tsx`:

1. Step 2 (around lines 786, 797–799): remove the `recap2` constant and the `{recap2 && <p>…</p>}` block.
2. Step 3 (around lines 861–863, and its render block): remove the `recap3` constant and its `<p>` render block.
3. Step 9 (around lines 937–939, 950–952): remove the `recap9` constant and its `<p>` render block.

No other behavior, copy, or step flow changes.
