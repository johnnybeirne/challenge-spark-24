
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (supports anonymous tracking before signup)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- Only allow reading via service role (admin edge function)
CREATE POLICY "No direct reads"
ON public.analytics_events
FOR SELECT
TO public
USING (false);
