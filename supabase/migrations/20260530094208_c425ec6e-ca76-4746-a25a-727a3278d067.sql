ALTER TABLE public.site_content
ADD COLUMN IF NOT EXISTS column_slot text NOT NULL DEFAULT 'full';

ALTER TABLE public.site_content
DROP CONSTRAINT IF EXISTS site_content_column_slot_check;

ALTER TABLE public.site_content
ADD CONSTRAINT site_content_column_slot_check
CHECK (column_slot IN ('full', 'left', 'right'));