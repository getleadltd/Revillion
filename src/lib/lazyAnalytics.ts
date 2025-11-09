// Google Analytics 4 - Enhanced Debug Loading with Consent Mode v2
import { initConsentMode } from './consentMode';

let gaLoaded = false;

// Check if debug mode is enabled
const isDebugMode = () => {
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
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag as any;
    
    // Configure GA4 with debug mode if enabled
    gtag('js', new Date());
    gtag('config', 'G-FKENPNYCSP', {
      send_page_view: false, // We'll send it manually
      debug_mode: debugMode
    });
    
    // Send initial page_view
    gtag('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title
    });
    
    // Send test ping event
    gtag('event', 'ga_test_ping', {
      source: 'init',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ GA script loaded & configured', {
      debugMode,
      pagePath: window.location.pathname,
      pageTitle: document.title
    });
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

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}
