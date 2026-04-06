
CREATE POLICY "Allow insert activity feed items"
ON public.activity_feed_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update activity feed items"
ON public.activity_feed_items
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete activity feed items"
ON public.activity_feed_items
FOR DELETE
USING (true);
