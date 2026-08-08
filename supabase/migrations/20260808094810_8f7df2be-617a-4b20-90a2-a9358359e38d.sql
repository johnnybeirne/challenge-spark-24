CREATE TABLE public.unlock_gates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT 'Unlock this',
  body text NOT NULL DEFAULT '',
  teaser_lines integer NOT NULL DEFAULT 3,
  price_cents integer NOT NULL DEFAULT 9700,
  price_id text NOT NULL DEFAULT '',
  invites_required integer NOT NULL DEFAULT 3,
  show_buy boolean NOT NULL DEFAULT true,
  show_invite boolean NOT NULL DEFAULT true,
  buy_label text NOT NULL DEFAULT 'Unlock now',
  invite_label text NOT NULL DEFAULT 'Invite to unlock',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.unlock_gates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unlock_gates TO authenticated;
GRANT ALL ON public.unlock_gates TO service_role;

ALTER TABLE public.unlock_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read unlock gates"
  ON public.unlock_gates FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert unlock gates"
  ON public.unlock_gates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update unlock gates"
  ON public.unlock_gates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete unlock gates"
  ON public.unlock_gates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_unlock_gates_updated_at
  BEFORE UPDATE ON public.unlock_gates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.unlock_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  gate_key text NOT NULL,
  source text NOT NULL DEFAULT 'invites',
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, gate_key)
);

GRANT SELECT, INSERT ON public.unlock_grants TO authenticated;
GRANT ALL ON public.unlock_grants TO service_role;

ALTER TABLE public.unlock_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlock grants"
  ON public.unlock_grants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can record their own invite unlock"
  ON public.unlock_grants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND source = 'invites');

CREATE TRIGGER update_unlock_grants_updated_at
  BEFORE UPDATE ON public.unlock_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.unlock_gates (key, label, title, body, price_cents, price_id, invites_required, sort_order)
VALUES (
  'day1',
  'Day 1',
  'Unlock Day 1',
  'Day 1 is locked. Unlock it instantly, or invite friends who join and unlock it free.',
  9700,
  'unlock_day1',
  3,
  1
);