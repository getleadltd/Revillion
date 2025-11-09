import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
        
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: pageTitle
        });
        
        console.debug('[GA4] page_view sent', {
          path: pagePath,
          title: pageTitle,
          timestamp: new Date().toISOString()
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
};
