-- Create partner_contributions table for partner applications
CREATE TABLE public.partner_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contribution_title TEXT NOT NULL,
  contribution_description TEXT NOT NULL,
  estimated_value INTEGER NOT NULL DEFAULT 97,
  contribution_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_contributions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own contributions
CREATE POLICY "Users can insert own contributions"
ON public.partner_contributions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own contributions
CREATE POLICY "Users can view own contributions"
ON public.partner_contributions
FOR SELECT
USING (auth.uid() = user_id);

-- Public read for approved contributions (for display in builder circle)
CREATE POLICY "Anyone can view approved contributions"
ON public.partner_contributions
FOR SELECT
USING (status = 'approved');

-- Allow updates (for admin via service role, and status field)
CREATE POLICY "Allow update contributions"
ON public.partner_contributions
FOR UPDATE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_partner_contributions_updated_at
BEFORE UPDATE ON public.partner_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();