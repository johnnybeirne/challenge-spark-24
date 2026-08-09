CREATE TABLE public.monthly_invite_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month text NOT NULL,
  invite_count integer NOT NULL DEFAULT 0,
  access_granted boolean NOT NULL DEFAULT false,
  access_status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT monthly_invite_tracking_user_month_unique UNIQUE (user_id, month)
);

GRANT SELECT ON public.monthly_invite_tracking TO authenticated;
GRANT ALL ON public.monthly_invite_tracking TO service_role;

ALTER TABLE public.monthly_invite_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly invite tracking"
ON public.monthly_invite_tracking
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_monthly_invite_tracking_month ON public.monthly_invite_tracking (month);

CREATE TRIGGER trg_monthly_invite_tracking_updated_at
BEFORE UPDATE ON public.monthly_invite_tracking
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();