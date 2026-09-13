# Restyle the quiz results summary

## What will change
- Rebuild the top results summary to match the supplied reference: a large segmented score gauge, archetype label, result headline and supporting line.
- Present the three existing category percentages in a tighter row of circular score cards beneath it.
- Keep all current score calculations, personalised archetype copy, animations, report access, advisor content and challenge button unchanged.
- Adapt the layout for smaller screens without using the uploaded screenshot as a static image.

## Verification
- Check low, middle and high preview results.
- Confirm each displayed percentage still comes from the visitor's quiz answers.
- Check desktop and mobile layouts and confirm the page builds successfully.

## Technical details
- Change only the results presentation and reuse the existing shared score-ring component.
- Build the large gauge from live page data so it remains accurate for every result.
