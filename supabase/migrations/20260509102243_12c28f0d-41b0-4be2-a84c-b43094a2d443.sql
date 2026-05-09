
CREATE TABLE public.kb_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  stage text NOT NULL DEFAULT 'all',
  source text,
  is_active boolean NOT NULL DEFAULT true,
  search_tsv tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active kb docs" ON public.kb_documents FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can read all kb docs" ON public.kb_documents FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can insert kb docs" ON public.kb_documents FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can update kb docs" ON public.kb_documents FOR UPDATE USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can delete kb docs" ON public.kb_documents FOR DELETE USING (has_role(auth.uid(),'admin'::app_role));

CREATE INDEX idx_kb_documents_fts ON public.kb_documents USING gin (search_tsv);
CREATE INDEX idx_kb_documents_tags ON public.kb_documents USING gin (tags);
CREATE INDEX idx_kb_documents_stage ON public.kb_documents (stage) WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.kb_documents_set_tsv()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_tsv := to_tsvector('english',
    coalesce(NEW.title,'') || ' ' || coalesce(NEW.content,'') || ' ' || coalesce(array_to_string(NEW.tags,' '),'')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kb_documents_tsv
  BEFORE INSERT OR UPDATE ON public.kb_documents
  FOR EACH ROW EXECUTE FUNCTION public.kb_documents_set_tsv();

CREATE TRIGGER trg_kb_documents_updated
  BEFORE UPDATE ON public.kb_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_user_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  assessment_type text,
  assessment_score integer,
  weak_dimension text,
  lms_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_modules text[] NOT NULL DEFAULT '{}',
  challenge_day integer,
  challenge_outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  build_goal text,
  is_premium boolean NOT NULL DEFAULT false,
  partner_code text,
  referral_count integer NOT NULL DEFAULT 0,
  last_active_stage text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_user_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai context" ON public.ai_user_context FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai context" ON public.ai_user_context FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ai context" ON public.ai_user_context FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_ai_user_context_updated
  BEFORE UPDATE ON public.ai_user_context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
