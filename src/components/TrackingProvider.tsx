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
import { initConsentMode } from '@/lib/consentMode';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    hj?: (...args: any[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}

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
  if (!measurementId || window.gtag) return;
  initConsentMode();

  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, 'ga4-script').then(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag(..._args: any[]) { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, { send_page_view: false });
    console.log('[GA4] initialized:', measurementId);
  });
}

function initGTM(containerId: string) {
  if (!containerId || document.getElementById('gtm-script')) return;
  const s = document.createElement('script');
  s.id = 'gtm-script';
  s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;
  document.head.appendChild(s);
  console.log('[GTM] initialized:', containerId);
}

function initMetaPixelFromSettings(pixelId: string) {
  if (!pixelId || window.fbq) return;

  const f = window as any;
  f.fbq = f.fbq || function () {
    f.fbq.callMethod ? f.fbq.callMethod.apply(f.fbq, arguments) : f.fbq.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = f.fbq;
  f.fbq.push = f.fbq;
  f.fbq.loaded = true;
  f.fbq.version = '2.0';
  f.fbq.queue = [];

  loadScript('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel-script').then(() => {
    window.fbq?.('init', pixelId);
    window.fbq?.('track', 'PageView');
    console.log('[Meta Pixel] initialized:', pixelId);
  });
}

function initHotjar(siteId: string) {
  if (!siteId || window.hj) return;
  const id = parseInt(siteId, 10);
  if (isNaN(id)) return;

  window._hjSettings = { hjid: id, hjsv: 6 };
  const f = window as any;
  f.hj = f.hj || function () { (f.hj.q = f.hj.q || []).push(arguments); };

  loadScript(`https://static.hotjar.com/c/hotjar-${id}.js?sv=6`, 'hotjar-script').then(() => {
    console.log('[Hotjar] initialized:', id);
  });
}

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const settings = useSettingsMap();
  const initialized = useRef(false);

  useEffect(() => {
    // Wait until settings are loaded (non-empty object)
    if (Object.keys(settings).length === 0) return;
    if (initialized.current) return;
    initialized.current = true;

    const { ga4_measurement_id, gtm_container_id, meta_pixel_id, hotjar_site_id } = settings;

    // GTM takes priority over direct GA4 (if both set, use GTM)
    if (gtm_container_id) {
      initGTM(gtm_container_id);
    } else if (ga4_measurement_id) {
      initGA4(ga4_measurement_id);
    }

    if (meta_pixel_id) initMetaPixelFromSettings(meta_pixel_id);
    if (hotjar_site_id) initHotjar(hotjar_site_id);
  }, [settings]);

  const { google_site_verification, bing_site_verification, gtm_container_id } = settings;

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

      {/* GTM noscript fallback */}
      {gtm_container_id && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtm_container_id}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      )}

      {children}
    </>
  );
};
