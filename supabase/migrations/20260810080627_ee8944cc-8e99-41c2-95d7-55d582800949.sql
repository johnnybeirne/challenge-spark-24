CREATE TABLE public.premium_membership_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL DEFAULT 'LeadTree Premium Membership',
  description text NOT NULL DEFAULT '24/7 access to Training, engage with the LeadTree Community, and attend Live Events with recordings.',
  asterisk_note text NOT NULL DEFAULT '*Invite 5 people who sign up for the challenge each month. Your cycle runs for 28 days from your signup date.',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_membership_content TO anon;
GRANT SELECT ON public.premium_membership_content TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.premium_membership_content TO authenticated;
GRANT ALL ON public.premium_membership_content TO service_role;

ALTER TABLE public.premium_membership_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read premium membership content"
  ON public.premium_membership_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can write premium membership content"
  ON public.premium_membership_content
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_premium_membership_content_updated_at
  BEFORE UPDATE ON public.premium_membership_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.premium_membership_content (heading, description, asterisk_note)
VALUES (
  'LeadTree Premium Membership',
  '24/7 access to Training, engage with the LeadTree Community, and attend Live Events with recordings.',
  '*Invite 5 people who sign up for the challenge each month. Your cycle runs for 28 days from your signup date.'
);