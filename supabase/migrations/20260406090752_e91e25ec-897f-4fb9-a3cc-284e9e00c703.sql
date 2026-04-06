
CREATE TABLE public.activity_feed_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  action TEXT NOT NULL,
  time_label TEXT NOT NULL DEFAULT 'just now',
  icon_type TEXT NOT NULL DEFAULT 'zap',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active feed items"
ON public.activity_feed_items
FOR SELECT
USING (is_active = true);

CREATE TRIGGER update_activity_feed_items_updated_at
BEFORE UPDATE ON public.activity_feed_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
