-- Add source column to track article origin
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN public.blog_posts.source IS 'Article source: manual, babylovegrowth, blog_queue';