-- Allow autopilot-generated posts to have no author
ALTER TABLE public.blog_posts ALTER COLUMN author_id DROP NOT NULL;
