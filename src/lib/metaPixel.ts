/**
 * Meta Pixel & Conversions API helpers
 *
 * SETUP: Replace META_PIXEL_ID with your actual Pixel ID from
 * Meta Business Manager → Events Manager → your Pixel → Settings
 */

export const META_PIXEL_ID = 'REPLACE_WITH_YOUR_PIXEL_ID'; // e.g. '1234567890123456'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/** Initialize the pixel — called once on app mount */
export const initMetaPixel = () => {
  if (typeof window === 'undefined' || !META_PIXEL_ID || META_PIXEL_ID.startsWith('REPLACE')) return;
  if (window.fbq) return; // already loaded

  const f = window as any;
  const b = document;
  const e = 'script';
  let n: any;

  f.fbq = f.fbq || function () {
    f.fbq.callMethod
      ? f.fbq.callMethod.apply(f.fbq, arguments)
      : f.fbq.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = f.fbq;
  f.fbq.push = f.fbq;
  f.fbq.loaded = true;
  f.fbq.version = '2.0';
  f.fbq.queue = [];

  n = b.createElement(e) as HTMLScriptElement;
  n.async = true;
  n.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const s = b.getElementsByTagName(e)[0];
  s.parentNode?.insertBefore(n, s);

  window.fbq('init', META_PIXEL_ID);
};

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
