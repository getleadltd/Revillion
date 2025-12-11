-- Add constraints to blog_analytics table to prevent abuse

-- Limit event_type to known valid values
ALTER TABLE public.blog_analytics
ADD CONSTRAINT valid_event_type
CHECK (event_type IN ('cta_click', 'page_view', 'scroll_depth', 'share', 'related_click'));

-- Limit event_data JSON size to 10KB to prevent storage exhaustion
ALTER TABLE public.blog_analytics
ADD CONSTRAINT event_data_size_limit
CHECK (event_data IS NULL OR octet_length(event_data::text) < 10000);

-- Limit text field lengths to reasonable values
ALTER TABLE public.blog_analytics
ADD CONSTRAINT text_fields_length_limit
CHECK (
  (post_slug IS NULL OR length(post_slug) < 200) AND
  (post_title IS NULL OR length(post_title) < 300) AND
  (post_category IS NULL OR length(post_category) < 50) AND
  (user_agent IS NULL OR length(user_agent) < 500) AND
  (referrer IS NULL OR length(referrer) < 1000)
);