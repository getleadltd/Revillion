// Google Analytics 4 Helper Functions

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track a custom event in Google Analytics 4
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track CTA (Call-to-Action) button clicks
 */
export const trackCTAClick = (location: string) => {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: location,
    value: 1
  });
};

/**
 * Track casino partner logo clicks
 */
export const trackPartnerLogoClick = (partnerName: string) => {
  trackEvent('partner_logo_click', {
    event_category: 'engagement',
    event_label: partnerName
  });
};

/**
 * Track section views for scroll tracking
 */
export const trackSectionView = (sectionName: string) => {
  trackEvent('section_view', {
    event_category: 'engagement',
    event_label: sectionName
  });
};

/**
 * Track page view with language
 */
export const trackPageView = (language: string) => {
  trackEvent('page_view', {
    event_category: 'engagement',
    language: language,
    page_path: window.location.pathname
  });
};

/**
 * Track language changes
 */
export const trackLanguageChange = (fromLang: string, toLang: string) => {
  trackEvent('language_switch', {
    event_category: 'engagement',
    from_language: fromLang,
    to_language: toLang
  });
};
