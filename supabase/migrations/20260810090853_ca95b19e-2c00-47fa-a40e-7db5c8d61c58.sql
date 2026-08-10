ALTER TABLE public.copilot_config
  ADD COLUMN IF NOT EXISTS max_tokens integer NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS page_heading text NOT NULL DEFAULT 'Ask Johnny AI',
  ADD COLUMN IF NOT EXISTS page_subheading text NOT NULL DEFAULT 'Get practical, beginner-friendly help designing, launching, and running your challenge.';

UPDATE public.copilot_config
   SET page_heading = COALESCE(NULLIF(page_heading, ''), 'Ask Johnny AI'),
       page_subheading = COALESCE(NULLIF(page_subheading, ''), 'Get practical, beginner-friendly help designing, launching, and running your challenge.'),
       max_tokens = COALESCE(max_tokens, 200);