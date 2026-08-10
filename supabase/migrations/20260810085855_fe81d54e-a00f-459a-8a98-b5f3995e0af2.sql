CREATE TABLE public.mentor_suggested_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL CHECK (context IN ('default', 'day1', 'day2', 'day3')),
  prompts text[] NOT NULL DEFAULT '{}' CHECK (coalesce(array_length(prompts, 1), 0) <= 4),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mentor_suggested_prompts_context_unique UNIQUE (context)
);

GRANT SELECT ON public.mentor_suggested_prompts TO anon;
GRANT SELECT ON public.mentor_suggested_prompts TO authenticated;
GRANT ALL ON public.mentor_suggested_prompts TO service_role;

ALTER TABLE public.mentor_suggested_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read mentor suggested prompts"
ON public.mentor_suggested_prompts
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage mentor suggested prompts"
ON public.mentor_suggested_prompts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mentor_suggested_prompts_updated_at
BEFORE UPDATE ON public.mentor_suggested_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mentor_suggested_prompts (context, prompts) VALUES
('default', ARRAY[
  'What is the one pain point my challenge should focus on?',
  'How do I name my challenge in one line?',
  'What should my quiz result tell someone?',
  'How do I get my first 5 people to join?'
]);