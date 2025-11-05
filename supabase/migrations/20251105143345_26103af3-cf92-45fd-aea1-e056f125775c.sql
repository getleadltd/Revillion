-- Create blog_analytics table for tracking blog-related events
CREATE TABLE public.blog_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'cta_click', 'page_view', 'scroll_depth', etc.
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  post_slug TEXT,
  post_title TEXT,
  post_category TEXT,
  event_data JSONB, -- Additional event-specific data
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view analytics"
ON public.blog_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Anyone can insert analytics events (public tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.blog_analytics
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_blog_analytics_event_type ON public.blog_analytics(event_type);
CREATE INDEX idx_blog_analytics_post_slug ON public.blog_analytics(post_slug);
CREATE INDEX idx_blog_analytics_created_at ON public.blog_analytics(created_at DESC);
CREATE INDEX idx_blog_analytics_post_id ON public.blog_analytics(post_id);