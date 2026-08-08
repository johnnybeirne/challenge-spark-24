CREATE TABLE public.builder_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  prompt text NOT NULL,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_prompts TO authenticated;
GRANT ALL ON public.builder_prompts TO service_role;

ALTER TABLE public.builder_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage builder prompts"
ON public.builder_prompts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_builder_prompts_updated_at
BEFORE UPDATE ON public.builder_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.builder_prompts (title, category, prompt, notes, sort_order) VALUES
('Standard unlock gate', 'Gating', 'Put the standard unlock gate on <thing>, gate key <short-name>.', 'Locks content behind two equal paths: invite 3 friends or buy. Config editable at Owner Console > Unlocks.', 10);