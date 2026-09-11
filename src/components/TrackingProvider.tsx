/**
 * TrackingProvider
 *
 * Loads tracking IDs from Supabase site_settings and initializes:
 * - Google Analytics 4 (or GTM if container ID is set)
 * - Meta Pixel
 * - Hotjar
 * - Adds Google/Bing verification meta tags
 *
 * Wraps the app so tracking is configured before any page renders.
 * IDs can be updated live from the admin Settings page.
 */

import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettingsMap } from '@/hooks/useSiteSettings';
import {
  ANALYTICS_READY_EVENT,
  CONSENT_CHANGE_EVENT,
  getConsentStatus,
  initConsentMode,
  updateConsent,
} from '@/lib/consentMode';
import type {} from '@/types/tracking';

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // non-blocking
    document.head.appendChild(s);
  });
}

function initGA4(measurementId: string) {
  if (!/^G-[A-Z0-9]+$/i.test(measurementId) || document.getElementById('ga4-script')) return;
  initConsentMode();
  const gtag = window.gtag;
  if (!gtag) return;

  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: false });
  updateConsent(true, false);
  window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));

  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, 'ga4-script').then(() => {
    console.log('[GA4] initialized:', measurementId);
  });
}

function initGTM(containerId: string) {
  if (!/^GTM-[A-Z0-9]+$/i.test(containerId) || document.getElementById('gtm-script')) return;
  initConsentMode();
  updateConsent(true, false);
  const s = document.createElement('script');
  s.id = 'gtm-script';
  s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;
  document.head.appendChild(s);
  window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
  console.log('[GTM] initialized:', containerId);
}

function initMetaPixelFromSettings(pixelId: string) {
  if (!/^\d{5,20}$/.test(pixelId) || window.fbq) return;

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  }) as MetaPixelFunction;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq ??= fbq;

  loadScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel-script').then(() => {
    window.fbq?.('init', pixelId);
    window.fbq?.('track', 'PageView');
    console.log('[Meta Pixel] initialized:', pixelId);
  });
}

function initHotjar(siteId: string) {
  if (!/^\d+$/.test(siteId) || window.hj) return;
  const id = parseInt(siteId, 10);
  if (isNaN(id)) return;

  window._hjSettings = { hjid: id, hjsv: 6 };
  const hj = ((...args: unknown[]) => {
    hj.q.push(args);
  }) as HotjarFunction;
  hj.q = [];
  window.hj = hj;

  loadScript(`https://static.hotjar.com/c/hotjar-${id}.js?sv=6`, 'hotjar-script').then(() => {
    console.log('[Hotjar] initialized:', id);
  });
}

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const settings = useSettingsMap();
  const initialized = useRef(false);

  useEffect(() => {
    const initializeTracking = () => {
      // Settings are fetched without marketing trackers so the IDs can remain
      // centrally managed. No third-party tracker is loaded before opt-in.
      if (Object.keys(settings).length === 0) return;
      if (getConsentStatus() !== 'accepted' || initialized.current) return;

      const { ga4_measurement_id, gtm_container_id, meta_pixel_id, hotjar_site_id } = settings;
      const validGtmId = Boolean(gtm_container_id && /^GTM-[A-Z0-9]+$/i.test(gtm_container_id));
      const validGa4Id = Boolean(ga4_measurement_id && /^G-[A-Z0-9]+$/i.test(ga4_measurement_id));
      const validMetaPixelId = Boolean(meta_pixel_id && /^\d{5,20}$/.test(meta_pixel_id));
      const validHotjarId = Boolean(hotjar_site_id && /^\d+$/.test(hotjar_site_id));

      if (!validGtmId && !validGa4Id && !validMetaPixelId && !validHotjarId) return;
      initialized.current = true;

      // GTM takes priority over direct GA4 (if both are configured).
      if (validGtmId) {
        initGTM(gtm_container_id);
      } else if (validGa4Id) {
        initGA4(ga4_measurement_id);
      }

      if (validMetaPixelId) initMetaPixelFromSettings(meta_pixel_id);
      if (validHotjarId) initHotjar(hotjar_site_id);
    };

    const handleConsentChange = (event: Event) => {
      const consentEvent = event as CustomEvent<{ status?: string }>;
      if (consentEvent.detail?.status === 'accepted') initializeTracking();
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
    initializeTracking();

    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
  }, [settings]);

  const { google_site_verification, bing_site_verification } = settings;

  return (
    <>
      <Helmet>
        {google_site_verification && (
          <meta name="google-site-verification" content={google_site_verification} />
        )}
        {bing_site_verification && (
          <meta name="msvalidate.01" content={bing_site_verification} />
        )}
      </Helmet>

      {children}
    </>
  );
};
