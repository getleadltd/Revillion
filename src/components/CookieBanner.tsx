import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  getConsentStatus,
  OPEN_COOKIE_SETTINGS_EVENT,
  updateConsent,
} from '@/lib/consentMode';
import { getSiteLanguage } from '@/lib/dashboard';

export const CookieBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const location = useLocation();
  const lang = getSiteLanguage(location.pathname.split('/')[1]);

  useEffect(() => {
    const consentStatus = getConsentStatus();
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    if (consentStatus === null) {
      showTimer = setTimeout(() => setIsVisible(true), 1200);
    }

    const openSettings = () => {
      setIsClosing(false);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);

    return () => {
      if (showTimer) clearTimeout(showTimer);
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    };
  }, []);

  const handleAccept = () => {
    updateConsent(true);
    dismiss();
  };

  const handleReject = () => {
    const previouslyAccepted = getConsentStatus() === 'accepted';
    updateConsent(false);
    if (previouslyAccepted) {
      // Consent Mode cannot unload scripts that have already executed. Reloading
      // after a revocation guarantees that no tracker is initialized again.
      window.location.reload();
      return;
    }
    dismiss();
  };

  const dismiss = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 350);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className={`fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6 transition-all duration-350 ease-in-out ${
        isClosing ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-[#141414] border border-white/10 rounded-2xl px-5 py-4 sm:px-6 sm:py-4 shadow-[0_0_60px_rgba(0,0,0,0.6)]">

          {/* Left: icon + text */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm">🍪</span>
            </div>
            <div className="min-w-0">
              <p id="cookie-consent-title" className="text-white font-semibold text-sm">{t('cookieBanner.title')}</p>
              <p id="cookie-consent-description" className="text-gray-400 text-xs leading-relaxed mt-0.5">
                {t('cookieBanner.description')}
              </p>
              <Link
                to={`/${lang}/privacy-policy`}
                className="mt-1 inline-block text-xs font-medium text-orange-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                {t('footer.privacyPolicy')}
              </Link>
            </div>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <button
              type="button"
              onClick={handleReject}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-300 hover:text-white border border-white/20 hover:border-white/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              {t('cookieBanner.rejectAll')}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-5 py-2 rounded-full text-xs font-bold bg-orange-500 hover:bg-orange-400 text-gray-950 transition-all duration-200 shadow-lg shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              {t('cookieBanner.acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
