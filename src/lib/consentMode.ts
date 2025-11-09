// Google Consent Mode v2 - GDPR Compliant
// Must be initialized BEFORE loading Google Analytics

const CONSENT_KEY = 'cookieConsent';

type ConsentStatus = 'accepted' | 'rejected' | null;

// Check if debug mode forces consent (for testing)
const isForceConsentEnabled = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('ga_force_consent') || localStorage.getItem('ga_force_consent') === '1';
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

  // Initialize dataLayer for gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag as any;

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
  }

  // Save choice to localStorage
  if (saveToStorage) {
    localStorage.setItem(CONSENT_KEY, granted ? 'accepted' : 'rejected');
    console.info(`[Consent] Saved to localStorage: ${granted ? 'accepted' : 'rejected'}`);
  }
};

// Debug helper for console
if (typeof window !== 'undefined') {
  (window as any).__gaDebugInfo = () => ({
    hasGtag: !!window.gtag,
    hasDataLayer: !!window.dataLayer,
    location: window.location.href,
    title: document.title,
    consentStatus: getConsentStatus(),
    forceConsent: isForceConsentEnabled(),
    gaCookies: document.cookie.split('; ').filter(c => c.startsWith('_ga'))
  });
}

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
