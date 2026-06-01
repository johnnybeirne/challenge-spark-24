
-- 1) activity_feed_items: lock down writes to admins
DROP POLICY IF EXISTS "Allow insert activity feed items" ON public.activity_feed_items;
DROP POLICY IF EXISTS "Allow update activity feed items" ON public.activity_feed_items;
DROP POLICY IF EXISTS "Allow delete activity feed items" ON public.activity_feed_items;

CREATE POLICY "Admins can insert activity feed items"
  ON public.activity_feed_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update activity feed items"
  ON public.activity_feed_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete activity feed items"
  ON public.activity_feed_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) profiles: remove blanket public SELECT; allow self + admin only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) waitlist_signups: remove public SELECT; admin-only reads
DROP POLICY IF EXISTS "Anyone can view waitlist entries" ON public.waitlist_signups;

CREATE POLICY "Admins can view waitlist entries"
  ON public.waitlist_signups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
