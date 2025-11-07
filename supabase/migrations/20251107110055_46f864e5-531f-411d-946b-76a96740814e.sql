-- Add multilingual slug columns to blog_posts table
ALTER TABLE blog_posts 
  ADD COLUMN slug_en TEXT,
  ADD COLUMN slug_de TEXT,
  ADD COLUMN slug_it TEXT,
  ADD COLUMN slug_pt TEXT,
  ADD COLUMN slug_es TEXT;

-- Copy existing slug to slug_it (default Italian)
UPDATE blog_posts SET slug_it = slug;

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug_en ON blog_posts(slug_en);
CREATE INDEX idx_blog_posts_slug_de ON blog_posts(slug_de);
CREATE INDEX idx_blog_posts_slug_it ON blog_posts(slug_it);
CREATE INDEX idx_blog_posts_slug_pt ON blog_posts(slug_pt);
CREATE INDEX idx_blog_posts_slug_es ON blog_posts(slug_es);