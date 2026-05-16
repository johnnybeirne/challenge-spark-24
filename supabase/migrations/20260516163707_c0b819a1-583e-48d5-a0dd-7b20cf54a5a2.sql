ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS landing_path text NOT NULL DEFAULT '/';
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'partner_status' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.partner_status ADD VALUE 'pending';
  END IF;
END $$;