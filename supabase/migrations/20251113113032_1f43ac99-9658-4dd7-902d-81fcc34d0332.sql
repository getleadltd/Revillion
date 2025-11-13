-- Fix search_path for track_redirect_hit function
DROP FUNCTION IF EXISTS public.track_redirect_hit(UUID);

CREATE OR REPLACE FUNCTION public.track_redirect_hit(redirect_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.url_redirects
  SET hit_count = hit_count + 1,
      last_hit_at = now()
  WHERE id = redirect_id;
END;
$$;