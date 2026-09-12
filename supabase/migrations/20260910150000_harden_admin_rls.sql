-- Scope administrative policies to authenticated admins.  This keeps public
-- requests from evaluating the private has_role() helper and closes legacy
-- policies that granted every authenticated account administrative access.

DROP POLICY IF EXISTS "Authenticated can manage agent tasks"
  ON public.agent_tasks;

-- This policy already exists in the production project. Recreate it below so
-- the migration remains safe across both legacy schema variants.
DROP POLICY IF EXISTS "Admins can manage agent tasks"
  ON public.agent_tasks;

CREATE POLICY "Admins can manage agent tasks"
  ON public.agent_tasks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view SEO logs"
  ON public.seo_monitoring_logs;
DROP POLICY IF EXISTS "Service role can insert SEO logs"
  ON public.seo_monitoring_logs;

CREATE POLICY "Admins can view SEO logs"
  ON public.seo_monitoring_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Edge Functions write these rows through the service-role client.  The
-- explicit role documents the intended writer even though service_role also
-- bypasses RLS in hosted Supabase projects.
CREATE POLICY "Service role can insert SEO logs"
  ON public.seo_monitoring_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert contact messages"
  ON public.contact_messages;

CREATE POLICY "Public can submit new contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND created_at = updated_at
    AND created_at >= now() - INTERVAL '5 minutes'
    AND created_at <= now() + INTERVAL '1 minute'
  );

DROP POLICY IF EXISTS "Admins can view all contact messages"
  ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages"
  ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages"
  ON public.contact_messages;

CREATE POLICY "Admins can view all contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- These older policies were created for PUBLIC.  Recreate them with an
-- authenticated role target before has_role() is private to anon.
ALTER POLICY "Admins can view all roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can insert roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can delete roles" ON public.user_roles TO authenticated;

ALTER POLICY "Admins can insert posts" ON public.blog_posts TO authenticated;
ALTER POLICY "Admins can update posts" ON public.blog_posts TO authenticated;
ALTER POLICY "Admins can delete posts" ON public.blog_posts TO authenticated;

ALTER POLICY "Admins can view queue" ON public.blog_queue TO authenticated;
ALTER POLICY "Admins can insert queue items" ON public.blog_queue TO authenticated;
ALTER POLICY "Admins can update queue items" ON public.blog_queue TO authenticated;
ALTER POLICY "Admins can delete queue items" ON public.blog_queue TO authenticated;

ALTER POLICY "Admins can view analytics" ON public.blog_analytics TO authenticated;

ALTER POLICY "Admins can insert redirects" ON public.url_redirects TO authenticated;
ALTER POLICY "Admins can update redirects" ON public.url_redirects TO authenticated;
ALTER POLICY "Admins can delete redirects" ON public.url_redirects TO authenticated;

ALTER POLICY "Admins can upload blog images" ON storage.objects TO authenticated;
ALTER POLICY "Admins can update blog images" ON storage.objects TO authenticated;
ALTER POLICY "Admins can delete blog images" ON storage.objects TO authenticated;
