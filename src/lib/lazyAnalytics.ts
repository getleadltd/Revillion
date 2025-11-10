// Google Analytics 4 - Enhanced Debug Loading with Consent Mode v2
import { initConsentMode } from './consentMode';
import type {} from './analytics';

let gaLoaded = false;

// Centralized Measurement ID
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-FKENPNYCSP';

// Check if debug mode is enabled
export const isDebugMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('ga_debug') || localStorage.getItem('ga_debug') === '1';
};

const loadGoogleAnalytics = () => {
  if (gaLoaded || typeof window === 'undefined') return;
  
  // CRITICAL: Initialize Consent Mode BEFORE loading GA
  initConsentMode();
  
  gaLoaded = true;
  const debugMode = isDebugMode();

  // Create and append GA script with error handling
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-FKENPNYCSP';
  
  script.onload = () => {
    // Initialize gtag with official Google pattern
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    
    // Configure GA4 with debug mode if enabled
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID, {
      send_page_view: false, // We'll send it manually
      debug_mode: debugMode
    });
    
    // Get and log client_id for verification
    gtag('get', MEASUREMENT_ID, 'client_id', (clientId: string) => {
      console.info('[GA4] client_id:', clientId);
    });
    
    // Send initial page_view
    gtag('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      debug_mode: debugMode
    });
    
    // Send test ping event
    gtag('event', 'ga_test_ping', {
      source: 'init',
      timestamp: new Date().toISOString(),
      debug_mode: debugMode
    });
    
    console.log('✅ GA script loaded & configured', {
      measurementId: MEASUREMENT_ID,
      debugMode,
      pagePath: window.location.pathname,
      pageTitle: document.title
    });
    
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('[GA4] Using hardcoded Measurement ID. Set VITE_GA_MEASUREMENT_ID in env for production.');
    }
  };
  
  script.onerror = () => {
    console.warn('❌ GA script failed to load (AdBlocker or network issue?)');
  };
  
  document.head.appendChild(script);
};

// Initialize GA4 immediately
export const initAnalytics = () => {
  loadGoogleAnalytics();
};

// Export for backward compatibility
export { loadGoogleAnalytics };
