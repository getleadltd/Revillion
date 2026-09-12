import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_READY_EVENT, getConsentStatus } from '@/lib/consentMode';

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
    let hasSentForLocation = false;

    const sendPageView = () => {
      if (
        hasSentForLocation
        || typeof window === 'undefined'
        || getConsentStatus() !== 'accepted'
        || !window.gtag
      ) {
        return;
      }

      hasSentForLocation = true;
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
    };

    // Wait a bit for the page title to update
    const timer = setTimeout(sendPageView, 100);
    window.addEventListener(ANALYTICS_READY_EVENT, sendPageView);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(ANALYTICS_READY_EVENT, sendPageView);
    };
  }, [location.pathname, location.search]);
};
