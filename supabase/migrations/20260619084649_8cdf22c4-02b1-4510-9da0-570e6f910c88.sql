-- 1) Table
CREATE TABLE public.day1_step_examples (
  step_id text NOT NULL,
  audience_type text NOT NULL CHECK (audience_type IN ('b2b','b2c')),
  audience_role text NOT NULL,
  label text NOT NULL,
  match_keywords text[] NOT NULL DEFAULT '{}',
  examples text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (step_id, audience_type, audience_role)
);

-- 2) Grants (publicly readable so the live flow can hydrate without auth; writes via admin policy)
GRANT SELECT ON public.day1_step_examples TO anon;
GRANT SELECT ON public.day1_step_examples TO authenticated;
GRANT ALL ON public.day1_step_examples TO service_role;

-- 3) RLS
ALTER TABLE public.day1_step_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read step examples"
  ON public.day1_step_examples
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert step examples"
  ON public.day1_step_examples
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update step examples"
  ON public.day1_step_examples
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete step examples"
  ON public.day1_step_examples
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) updated_at trigger
CREATE TRIGGER day1_step_examples_updated_at
  BEFORE UPDATE ON public.day1_step_examples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Seed Step 5 rows (B2B)
INSERT INTO public.day1_step_examples (step_id, audience_type, audience_role, label, match_keywords, examples, sort_order) VALUES
  ('step-5','b2b','default','Default (any B2B audience)','{}',
    ARRAY['Can''t generate consistent leads','Struggle to close at the right price','Marketing isn''t bringing in clients'], 0),
  ('step-5','b2b','coach','Independent coaches','{coach}',
    ARRAY['Can''t get first paying clients','Struggling with pricing','Don''t know how to sell their offer'], 10),
  ('step-5','b2b','consultant','Consultants','{consultant}',
    ARRAY['Pipeline dries up between projects','Hard to charge what they''re worth','Stuck trading hours for fees'], 20),
  ('step-5','b2b','agency','Service-based agency owners','{agency,agencies}',
    ARRAY['Stuck under a revenue ceiling','Drowning in client delivery','Inconsistent lead flow'], 30),
  ('step-5','b2b','saas','SaaS founders','{saas,founder,startup}',
    ARRAY['Can''t convert free trials to paid','Churn is killing growth','Acquisition cost is too high'], 40),
  ('step-5','b2b','course-creator','Course creators','{course}',
    ARRAY['Course launches fall flat','Low completion rates','Can''t grow an email list'], 50),
  ('step-5','b2b','speaker','Speakers','{speaker}',
    ARRAY['Not getting booked enough','Hard to stand out in their niche','Audience growth has stalled'], 60),
  ('step-5','b2b','trainer','Trainers','{trainer}',
    ARRAY['Not getting booked enough','Hard to stand out in their niche','Audience growth has stalled'], 70),
  ('step-5','b2b','author','Authors','{author}',
    ARRAY['Book sales have flatlined','Hard to turn readers into clients','Can''t grow their platform'], 80);

-- 6) Seed Step 5 rows (B2C)
INSERT INTO public.day1_step_examples (step_id, audience_type, audience_role, label, match_keywords, examples, sort_order) VALUES
  ('step-5','b2c','default','Default (any B2C audience)','{}',
    ARRAY['Feel stuck and don''t know where to start','Have tried before and nothing sticks','Overwhelmed and short on time'], 0),
  ('step-5','b2c','parents','Parents','{parent,mum,mom,dad}',
    ARRAY['Constantly exhausted and short on time','Feel guilty they''re not doing enough','Can''t find a routine that actually sticks'], 10),
  ('step-5','b2c','fitness','Fitness, health & wellness','{fitness,weight,health,wellness}',
    ARRAY['Keep starting over and losing momentum','Don''t know what actually works for them','No energy left at the end of the day'], 20),
  ('step-5','b2c','students','Students & career changers','{student,career,professional}',
    ARRAY['Feel stuck and unsure what''s next','Overwhelmed by too many options','Lack the confidence to make a move'], 30),
  ('step-5','b2c','couples','Couples & relationships','{couple,relationship,dating}',
    ARRAY['Keep having the same argument','Feel disconnected from their partner','Don''t know how to bring the spark back'], 40),
  ('step-5','b2c','creatives','Creatives & hobbyists','{creative,artist,musician,hobby}',
    ARRAY['Keep starting projects they never finish','Can''t find time to practise consistently','Doubt whether their work is good enough'], 50),
  ('step-5','b2c','retirees','Retirees & later-life','{retire,later life,senior}',
    ARRAY['Unsure how to fill their time meaningfully','Worried about staying active and sharp','Want connection but don''t know where to start'], 60);

-- 7) Update the Step 5 question text to match the visible UI
UPDATE public.day1_step_messages
  SET message = 'What''s the single most painful problem they have?'
  WHERE id = 'step-5';
