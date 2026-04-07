/**
 * Meta Pixel tracking helpers
 *
 * Pixel initialization is handled by TrackingProvider (reads pixel ID from DB).
 * These helpers assume window.fbq is already available.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

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
 * Also fires server-side via CAPI for reliability (post iOS 14)
 */
export const trackMetaLead = async (params?: {
  email?: string;
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

  // Server-side CAPI (more reliable, bypasses ad blockers)
  if (params?.email) {
    try {
      await fetch('/api/meta-capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'Lead',
          email: params.email,
          source: params.source,
          page_url: window.location.href,
        }),
      });
    } catch {
      // CAPI failure is non-blocking
    }
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
