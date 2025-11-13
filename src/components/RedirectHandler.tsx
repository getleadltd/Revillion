import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * RedirectHandler component
 * Handles 301 redirects from old URLs to new URLs based on url_redirects table
 */
export const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      const currentPath = location.pathname;

      try {
        // Query the url_redirects table for matching old_url
        const { data: redirect, error } = await supabase
          .from('url_redirects')
          .select('id, new_url')
          .eq('old_url', currentPath)
          .maybeSingle();

        if (error) {
          console.error('Error checking redirects:', error);
          return;
        }

        // If redirect found, track the hit and navigate to new URL
        if (redirect) {
          console.log(`[Redirect] ${currentPath} -> ${redirect.new_url}`);
          
          // Track redirect hit (fire and forget - don't wait for response)
          supabase.rpc('track_redirect_hit', { redirect_id: redirect.id });

          // Navigate to new URL (replace in history to avoid back button loop)
          navigate(redirect.new_url, { replace: true });
        }
      } catch (error) {
        console.error('Redirect handler error:', error);
      }
    };

    checkAndRedirect();
  }, [location.pathname, navigate]);

  // This component doesn't render anything
  return null;
};
