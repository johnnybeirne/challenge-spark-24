
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS default_l2_commission_type commission_kind NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS default_l2_commission_value numeric NOT NULL DEFAULT 10;
