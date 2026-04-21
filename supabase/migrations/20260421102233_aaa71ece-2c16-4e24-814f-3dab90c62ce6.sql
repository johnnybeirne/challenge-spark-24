-- Singleton table for Johnny B AI config (system prompt, welcome, starter questions)
CREATE TABLE public.copilot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL DEFAULT 'You are a concise, actionable AI co-pilot for a 3-day trust-leverage challenge. Keep every answer under 300 words. Be direct, practical, and encouraging. Focus on helping the user build, ship, and grow.',
  welcome_message text NOT NULL DEFAULT 'Ask Johnny B AI anything about the challenge',
  starter_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_config ENABLE ROW LEVEL SECURITY;

-- Public read so the chat widget and edge function can fetch config
CREATE POLICY "Anyone can read copilot config"
  ON public.copilot_config FOR SELECT
  USING (true);

-- Open write for now (CMS is owner-only via UI); tighten later with admin role table
CREATE POLICY "Anyone can insert copilot config"
  ON public.copilot_config FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update copilot config"
  ON public.copilot_config FOR UPDATE
  USING (true);

CREATE TRIGGER trg_copilot_config_updated_at
  BEFORE UPDATE ON public.copilot_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the singleton row with default starter questions
INSERT INTO public.copilot_config (system_prompt, welcome_message, starter_questions)
VALUES (
  'You are a concise, actionable AI co-pilot for a 3-day trust-leverage challenge. Keep every answer under 300 words. Be direct, practical, and encouraging. Focus on helping the user build, ship, and grow.',
  'Welcome to the 3-Day Trust-Leverage Challenge. Ask me anything about your build.',
  '["What should I do first?", "How do I define my app idea?", "Give me a launch checklist"]'::jsonb
);