/**
 * Meta Pixel tracking helpers
 *
 * Pixel initialization is handled by TrackingProvider (reads pixel ID from DB).
 * These helpers assume window.fbq is already available.
 */
import type {} from '@/types/tracking';

/** Fire PageView — call on every route change */
export const trackMetaPageView = () => {
  if (!window.fbq) return;
  window.fbq('track', 'PageView');
};

/** Fire ViewContent — when user scrolls to key section or opens calculator */
export const trackMetaViewContent = (contentName: string, contentCategory = 'affiliate') => {
  if (!window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_name: contentName,
    content_category: contentCategory,
  });
};

/**
 * Fire Lead — when user clicks a primary CTA
 * Server-side CAPI events must be sent independently by a trusted backend.
 */
export const trackMetaLead = (params?: {
  source?: string;
  value?: number;
}) => {
  // Client-side pixel
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: params?.source || 'cta_click',
      currency: 'USD',
      value: params?.value || 0,
    });
  }

};

/**
 * Fire CompleteRegistration — after successful signup
 * Triggered via postMessage from dashboard iframe or redirect callback
 */
export const trackMetaCompleteRegistration = (value?: number) => {
  if (!window.fbq) return;
  window.fbq('track', 'CompleteRegistration', {
    currency: 'USD',
    value: value || 0,
    status: true,
  });
};
