-- Q&A library table
CREATE TABLE public.copilot_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active copilot qa"
ON public.copilot_qa FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can read all copilot qa"
ON public.copilot_qa FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert copilot qa"
ON public.copilot_qa FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update copilot qa"
ON public.copilot_qa FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete copilot qa"
ON public.copilot_qa FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_copilot_qa_updated_at
BEFORE UPDATE ON public.copilot_qa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add fallback_message to copilot_config
ALTER TABLE public.copilot_config
ADD COLUMN fallback_message TEXT NOT NULL DEFAULT 'I don''t have an answer for that yet. Try one of the suggested questions below.';