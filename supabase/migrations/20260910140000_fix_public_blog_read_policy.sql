-- Keep public blog reads independent from the private role-checking helper.
--
-- The previous policy evaluated has_role() for anonymous requests. If EXECUTE
-- on that helper is (correctly) unavailable to anon, PostgREST rejects the
-- whole SELECT instead of returning the published rows.

DROP POLICY IF EXISTS "Anyone can view published posts"
  ON public.blog_posts;

DROP POLICY IF EXISTS "Public can view published posts"
  ON public.blog_posts;

DROP POLICY IF EXISTS "Admins can view all posts"
  ON public.blog_posts;

CREATE POLICY "Public can view published posts"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can view all posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
