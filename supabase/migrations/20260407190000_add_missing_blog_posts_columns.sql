-- Add missing columns to blog_posts table for autopilot pipeline
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS faq_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schema_type TEXT DEFAULT 'Article',
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
