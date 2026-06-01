CREATE TABLE public.day1_step_messages (
  id text PRIMARY KEY,
  message text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.day1_step_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day1_step_messages TO authenticated;
GRANT ALL ON public.day1_step_messages TO service_role;

ALTER TABLE public.day1_step_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read day1 step messages"
ON public.day1_step_messages FOR SELECT
USING (true);

CREATE POLICY "Admins can insert day1 step messages"
ON public.day1_step_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update day1 step messages"
ON public.day1_step_messages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete day1 step messages"
ON public.day1_step_messages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_day1_step_messages_updated_at
BEFORE UPDATE ON public.day1_step_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.day1_step_messages;