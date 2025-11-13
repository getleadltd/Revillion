-- Create url_redirects table for managing 301 redirects
CREATE TABLE IF NOT EXISTS public.url_redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  old_url TEXT NOT NULL UNIQUE,
  new_url TEXT NOT NULL,
  redirect_type INTEGER NOT NULL DEFAULT 301,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMP WITH TIME ZONE
);

-- Create index for fast old_url lookups
CREATE INDEX IF NOT EXISTS idx_url_redirects_old_url ON public.url_redirects(old_url);

-- Enable RLS
ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;

-- Allow public reads (for redirect handling)
CREATE POLICY "Anyone can read redirects"
ON public.url_redirects
FOR SELECT
USING (true);

-- Only admins can insert/update/delete redirects
CREATE POLICY "Admins can insert redirects"
ON public.url_redirects
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update redirects"
ON public.url_redirects
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete redirects"
ON public.url_redirects
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to track redirect hits
CREATE OR REPLACE FUNCTION public.track_redirect_hit(redirect_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.url_redirects
  SET hit_count = hit_count + 1,
      last_hit_at = now()
  WHERE id = redirect_id;
END;
$$;