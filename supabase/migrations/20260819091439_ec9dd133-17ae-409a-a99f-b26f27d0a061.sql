
CREATE TABLE IF NOT EXISTS public.day2_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cards_prompt text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.day2_ai_config TO anon;
GRANT SELECT, INSERT, UPDATE ON public.day2_ai_config TO authenticated;
GRANT ALL ON public.day2_ai_config TO service_role;

ALTER TABLE public.day2_ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read day2 ai config" ON public.day2_ai_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert day2 ai config" ON public.day2_ai_config FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update day2 ai config" ON public.day2_ai_config FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.day2_ai_config (cards_prompt)
SELECT 'You are writing three short education card bodies for Day 2 Section 1 of a quiz-marketing challenge.

Builder''s Day 1 context (reference these as ideas — make each paragraph specific to this person, but do NOT quote the values word for word):
- first name: {firstName}
- clientAvatar: {audience}
- superpower: {superpower}
- problem: {problem}
- challengeOutcome: {outcome}
- challengePromise: {promise}

Write three short card bodies in natural flowing prose.
Formatting rules — apply to every card:
- Each paragraph must contain exactly one sentence.
- Leave a blank line between every paragraph.
- Never combine multiple points into one paragraph.
- Each card must be 3 to 4 short paragraphs total.
{nameRule}

Card 1 must convey: the challenge asks a lot of someone who has never met you, the quiz earns that commitment by showing them where they stand in two minutes, making the problem feel real and the challenge the obvious next step.
Card 2 must convey: most quiz funnels end at the result and rely on email to convert, this quiz leads directly into the challenge where the expert''s superpower solves the exact problem the quiz surfaced.
Card 3 must convey: everyone who joins through the quiz already believes they have a problem worth solving, and three days of showing up and guiding them toward their outcome turns a quiz taker into a buyer.

Return only the JSON object, no preamble, no markdown. Exact shape:
{"card1":"...","card2":"...","card3":"..."}'
WHERE NOT EXISTS (SELECT 1 FROM public.day2_ai_config);

INSERT INTO public.site_content (page, section, key, value, value_type, label, sort_order)
VALUES
('day2','cards','1.title','The quiz earns the right to ask for 3 days.','text','Card 1 title',1),
('day2','cards','2.title','Most quizzes stop at the result. Yours does not.','text','Card 2 title',2),
('day2','cards','3.title','Three days builds more trust than three months of emails.','text','Card 3 title',3),
('day2','cards','1.body_fallback','Your challenge asks a lot of someone who has never met you.

Your quiz earns that commitment.

In two minutes it shows your audience exactly where they stand, makes the problem feel real, and makes your challenge the obvious next step.

You are not pitching.

You are launching a diagnostic that makes people ask to join.','text','Card 1 body fallback',4),
('day2','cards','2.body_fallback','Most quiz funnels end at the result and spend weeks in email trying to convert.

Yours is different.

The result page is the entrance to your challenge, not the exit from your funnel.

When your audience sees their result they are not getting generic tips.

They are being invited into three days where your expertise solves the exact problem the quiz just surfaced.','text','Card 2 body fallback',5),
('day2','cards','3.body_fallback','Everyone who joins your challenge through the quiz already believes they have a problem worth solving.

Your job over three days is to prove you are the person to help them solve it.

You guide them, show up for them, and move them toward the result in real time.

By Day 3 they have experienced your expertise first hand.

That is what turns a quiz taker into a buyer.','text','Card 3 body fallback',6),
('day2','cards','mark_read','Mark as read to continue','text','Mark as read button',7),
('day2','cards','marked_read','Marked as read','text','Marked as read confirmation',8),
('day2','cards','sender_name','Johnny B AI','text','Card message sender name',9),
('day2','cards','sender_status_thinking','Thinking…','text','Card sender status while writing',10),
('day2','cards','sender_status_done','Message','text','Card sender status when finished',11),
('day2','hint','locked','Read each section above and tap "Mark as read" on 1, 2 and 3 to unlock.','text','Locked hint bubble',12),
('day2','hint','locked_tooltip','Mark all three sections as read to unlock','text','Locked button tooltip',13),
('day2','ui','intro','You''re building this for {audience}.','text','Page intro line',14),
('day2','ui','assets_note_title','Your quiz downloads will land in Your Assets','text','Downloads note title',15),
('day2','ui','assets_note_body','Opens in a new tab. When your quiz is ready, your Word doc and Google Doc will be waiting on your dashboard.','text','Downloads note body',16),
('day2','ui','assets_link','Go to Your Assets','text','Your Assets link text',17),
('day2','ui','quiz_ready_title','Your quiz assets are ready','text','Quiz ready title',18),
('day2','ui','quiz_ready_body','Download your quiz right here, or grab it any time from Your Assets on your dashboard.','text','Quiz ready body',19),
('day2','ui','upsell_title','Want to go deeper on quiz funnel strategy?','text','Upsell card heading',20)
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_page_tags (page_key, label, tags)
VALUES ('/owner-console/day2-content','Day 2 Content','day 2, day two, day 2 content, cards, reveal cards, quiz marketing, bodies, ai prompt')
ON CONFLICT DO NOTHING;
