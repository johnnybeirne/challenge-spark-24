
CREATE TABLE public.diagnostic_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier text NOT NULL UNIQUE,
  min_percent integer NOT NULL,
  max_percent integer NOT NULL,
  title text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read diagnostic responses"
ON public.diagnostic_responses FOR SELECT
USING (true);

CREATE POLICY "Admins can insert diagnostic responses"
ON public.diagnostic_responses FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update diagnostic responses"
ON public.diagnostic_responses FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete diagnostic responses"
ON public.diagnostic_responses FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_diagnostic_responses_updated_at
BEFORE UPDATE ON public.diagnostic_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.diagnostic_responses (tier, min_percent, max_percent, title, messages) VALUES
('low', 0, 50, 'Manual Growth', '["Your lead flow depends heavily on your own effort.", "If you stop, it slows or stops. There''s no real system supporting you yet.", "The good news? A simple 3-day system can change that fast."]'::jsonb),
('mid', 51, 75, 'Inconsistent System', '["You have pieces in place, but it''s not reliable.", "Some things work, but they don''t connect into a consistent flow.", "Let''s tighten it up so it runs without you having to push every day."]'::jsonb),
('high', 76, 100, 'Emerging Engine', '["You already have elements of a system.", "With the right structure, this could become predictable and scalable.", "The challenge will help you turn what works into a repeatable engine."]'::jsonb);
