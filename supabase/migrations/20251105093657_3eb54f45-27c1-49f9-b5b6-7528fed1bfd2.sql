-- Remove old category constraint
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS valid_category;

-- Add new category constraint with updated categories
ALTER TABLE public.blog_posts ADD CONSTRAINT valid_category 
  CHECK (category IN ('news', 'guides', 'reviews', 'tips'));