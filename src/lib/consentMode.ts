// Google Consent Mode v2 - GDPR Compliant
// Must be initialized BEFORE loading Google Analytics

// Import global types
import type {} from './analytics';

const CONSENT_KEY = 'cookieConsent';

type ConsentStatus = 'accepted' | 'rejected' | null;

// Check if debug mode forces consent (for testing)
const isForceConsentEnabled = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('ga_force_consent') || localStorage.getItem('ga_force_consent') === '1';
};

// Check if debug mode is enabled
const isDebugMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('ga_debug') || localStorage.getItem('ga_debug') === '1';
};

// Get stored consent status
export const getConsentStatus = (): ConsentStatus => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  return (stored === 'accepted' || stored === 'rejected') ? stored as ConsentStatus : null;
};

// Initialize Consent Mode BEFORE GA loads
export const initConsentMode = () => {
  if (typeof window === 'undefined') return;

  // Initialize dataLayer for gtag with official pattern
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Set default consent state (denied until user accepts)
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500 // Wait 500ms for user consent before sending data
  });

  console.info('[Consent] Default state: denied (GDPR compliant)');

  // If user has already consented, update immediately
  const existingConsent = getConsentStatus();
  const forceConsent = isForceConsentEnabled();

  if (forceConsent) {
    console.warn('[Consent] Force consent enabled for debugging');
    updateConsent(true, false);
  } else if (existingConsent === 'accepted') {
    updateConsent(true, false);
  } else if (existingConsent === 'rejected') {
    console.info('[Consent] User previously rejected cookies');
  }
};

// Update consent when user makes a choice
export const updateConsent = (granted: boolean, saveToStorage = true) => {
  if (typeof window === 'undefined') return;

  const consentState = granted ? 'granted' : 'denied';

  // Update consent in gtag
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: consentState,
      ad_storage: 'denied', // We only use analytics, not ads
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    console.info(`[Consent] Updated: analytics_storage=${consentState}`);

    // If consent is granted, send immediate page_view and test event with retry
    if (granted) {
      const sendImmediateEvents = (attempt = 1) => {
        if (!window.gtag && attempt <= 3) {
          console.warn(`[GA4] gtag not ready, retry ${attempt}/3`);
          setTimeout(() => sendImmediateEvents(attempt + 1), 250);
          return;
        }

        if (!window.gtag) {
          console.error('[GA4] gtag not available after retries');
          return;
        }

        const pagePath = window.location.pathname + window.location.search;
        const pageTitle = document.title;
        const debugMode = isDebugMode();

        // Send page_view immediately after consent
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: pageTitle,
          debug_mode: debugMode
        });

        // Send test event for debugging
        window.gtag('event', 'consent_accepted', {
          event_category: 'consent',
          event_label: 'cookie_banner',
          timestamp: new Date().toISOString(),
          debug_mode: debugMode
        });

        console.info('[GA4] Events sent immediately after consent', { 
          pagePath, 
          pageTitle,
          debugMode,
          timestamp: new Date().toISOString()
        });
      };

      sendImmediateEvents();
    }
  }

  // Save choice to localStorage
  if (saveToStorage) {
    localStorage.setItem(CONSENT_KEY, granted ? 'accepted' : 'rejected');
    console.info(`[Consent] Saved to localStorage: ${granted ? 'accepted' : 'rejected'}`);
  }
};

// Debug helper for console
if (typeof window !== 'undefined') {
  (window as any).__gaDebugInfo = () => {
    const info: any = {
      hasGtag: !!window.gtag,
      hasDataLayer: !!window.dataLayer,
      dataLayerLength: window.dataLayer?.length || 0,
      measurementId: 'G-FKENPNYCSP',
      location: window.location.href,
      title: document.title,
      consentStatus: getConsentStatus(),
      forceConsent: isForceConsentEnabled(),
      debugMode: isDebugMode(),
      gaCookies: document.cookie.split('; ').filter(c => c.startsWith('_ga'))
    };

    // Try to get client_id if gtag is available
    if (window.gtag) {
      window.gtag('get', 'G-FKENPNYCSP', 'client_id', (cid: string) => {
        console.info('[GA4] Current client_id:', cid);
      });
    }

    return info;
  };

  console.info('[GA4] Debug helper available: window.__gaDebugInfo()');
}
