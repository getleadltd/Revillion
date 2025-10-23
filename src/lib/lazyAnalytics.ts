// Lazy-loaded Google Analytics 4
// Loads GA4 only after user interaction to reduce initial bundle size

let gaLoaded = false;

const loadGoogleAnalytics = () => {
  if (gaLoaded || typeof window === 'undefined') return;
  
  gaLoaded = true;

  // Create and append GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-FKENPNYCSP';
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag as any;
  
  gtag('js', new Date());
  gtag('config', 'G-FKENPNYCSP', {
    page_path: window.location.pathname,
    send_page_view: true
  });
};

// Initialize GA4 on first user interaction
export const initLazyAnalytics = () => {
  if (gaLoaded) return;

  const events = ['mousedown', 'touchstart', 'scroll', 'keydown'];
  
  const loadOnce = () => {
    loadGoogleAnalytics();
    events.forEach(event => window.removeEventListener(event, loadOnce));
  };

  events.forEach(event => window.addEventListener(event, loadOnce, { once: true, passive: true }));
  
  // Fallback: load after 5 seconds if no interaction
  setTimeout(() => {
    if (!gaLoaded) loadGoogleAnalytics();
  }, 5000);
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
