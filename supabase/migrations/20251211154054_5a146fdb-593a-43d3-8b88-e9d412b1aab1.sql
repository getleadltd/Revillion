-- Add source_language column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS source_language text DEFAULT 'it';

-- Add comment for documentation
COMMENT ON COLUMN public.blog_posts.source_language IS 'Original language of the article (en, de, it, pt, es). Used for automatic translation detection.';