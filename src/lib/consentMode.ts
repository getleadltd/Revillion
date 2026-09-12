// Google Consent Mode v2 - GDPR Compliant
// Must be initialized BEFORE loading Google Analytics

import type {} from '@/types/tracking';

const CONSENT_KEY = 'cookieConsent';
export const CONSENT_CHANGE_EVENT = 'revillion:consent-change';
export const OPEN_COOKIE_SETTINGS_EVENT = 'revillion:open-cookie-settings';
export const ANALYTICS_READY_EVENT = 'revillion:analytics-ready';

type ConsentStatus = 'accepted' | 'rejected' | null;

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
  if (window.gtag) return;

  // Initialize dataLayer for gtag with official pattern
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
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
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, {
      detail: { status: granted ? 'accepted' : 'rejected' },
    }));
  }
};

// Debug helper for console
if (typeof window !== 'undefined') {
  window.__gaDebugInfo = () => {
    const info: Record<string, unknown> = {
      hasGtag: !!window.gtag,
      hasDataLayer: !!window.dataLayer,
      dataLayerLength: window.dataLayer?.length || 0,
      location: window.location.href,
      title: document.title,
      consentStatus: getConsentStatus(),
      debugMode: isDebugMode(),
      gaCookies: document.cookie.split('; ').filter(c => c.startsWith('_ga'))
    };

    return info;
  };

  console.info('[GA4] Debug helper available: window.__gaDebugInfo()');
}
