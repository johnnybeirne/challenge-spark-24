CREATE TABLE public.monthly_points_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month text NOT NULL,
  points_total integer NOT NULL DEFAULT 0,
  access_status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT monthly_points_tracking_user_month_key UNIQUE (user_id, month),
  CONSTRAINT monthly_points_tracking_access_status_check CHECK (access_status IN ('active', 'locked_out'))
);

GRANT SELECT ON public.monthly_points_tracking TO authenticated;
GRANT ALL ON public.monthly_points_tracking TO service_role;

ALTER TABLE public.monthly_points_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly points"
  ON public.monthly_points_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_monthly_points_tracking_user_month
  ON public.monthly_points_tracking (user_id, month);

CREATE TRIGGER trg_monthly_points_tracking_updated_at
  BEFORE UPDATE ON public.monthly_points_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();