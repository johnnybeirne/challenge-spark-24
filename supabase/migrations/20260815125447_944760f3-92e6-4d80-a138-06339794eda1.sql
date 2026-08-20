insert into public.kb_documents (slug, title, content, tags, stage, source, is_active)
values (
  'promise-writing-reference',
  'Promise writing reference',
  $doc$# Promise writing reference

Instructional reference material. This teaches a method for writing a four part transformation promise. It is not finished copy and none of it should be reused word for word.

## The four part shape

A promise has four parts, always in this order, and every part describes the audience, never the builder.

1. From a current state. Where the audience is right now, described through the problem they live with.
2. To a future state. Where they end up after the transformation, described through the result they get.
3. So that a deeper payoff. Why the future state actually matters to them, one level below the surface result.
4. And stop a pain from happening or from continuing. The thing that ends for them. Choose "from happening" when the pain is a risk they want to avoid, and "from continuing" when the pain is already running.

## How to build each part

Current state: use the audience's lived experience of the problem in plain words. Describe the situation, not a feeling word on its own.

Future state: name the concrete result. It should be recognisable as the opposite of the current state, so the two parts read as a matched pair.

Deeper payoff: ask what the future state unlocks for them. Money, confidence, control, time, certainty, standing. Keep it human.

And stop: name the specific behaviour, cost or risk that ends. It should point back at the current state so the promise closes the loop.

## Quality tests

- Each part is a short phrase, roughly four to sixteen words.
- The four parts read as one flowing sentence when joined.
- Every part is about the audience.
- No jargon, no buzzwords, no marketing speak, no dashes of any kind.
- The from and to parts are a true pair, not two unrelated ideas.
- The payoff is deeper than the result, not a restatement of it.
- The and stop part names something real that ends.

## Common failures

- The and stop part is dropped, so the promise loses its edge.
- The payoff repeats the future state in different words.
- The promise describes what the builder does instead of what changes for the audience.
- Abstract language that could belong to any audience.
- A future state with no matching current state.

## Example patterns

These show the shape only. They are patterns to learn from, never content to reuse.

From an unpredictable flow of enquiries, to a steady stream of the right enquiries, so that they can plan the months ahead with confidence, and stop quiet weeks from continuing.

From guessing what their audience wants, to knowing exactly what their audience asks for, so that every offer lands on a real need, and stop wasted work from happening.

Read the pattern, then write something new using only this participant's own audience, problem, outcome and method.
$doc$,
  ARRAY['promise','transformation','day1','reference'],
  'day1',
  'internal',
  true
)
on conflict (slug) do update set content = excluded.content, tags = excluded.tags, stage = excluded.stage, is_active = true, updated_at = now();