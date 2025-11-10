import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Check if debug mode is enabled
const isDebugMode = () => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('ga_debug') || localStorage.getItem('ga_debug') === '1';
};

/**
 * Hook to track page views in Google Analytics 4 on route changes
 * Automatically sends page_view event whenever the route changes
 */
export const useGA4PageViews = () => {
  const location = useLocation();

  useEffect(() => {
    // Wait a bit for the page title to update
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.gtag) {
        const pagePath = location.pathname + location.search;
        const pageTitle = document.title;
        const debugMode = isDebugMode();
        
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: pageTitle,
          debug_mode: debugMode
        });
        
        console.debug('[GA4] page_view sent', {
          path: pagePath,
          title: pageTitle,
          debugMode,
          timestamp: new Date().toISOString()
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
};
