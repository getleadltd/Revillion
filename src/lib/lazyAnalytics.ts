// Google Analytics 4 - Immediate Loading
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
  
  console.log('✅ Google Analytics loaded immediately');
};

// Initialize GA4 immediately
export const initAnalytics = () => {
  loadGoogleAnalytics();
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
