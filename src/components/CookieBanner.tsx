import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getConsentStatus, updateConsent } from '@/lib/consentMode';

export const CookieBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const consentStatus = getConsentStatus();
    if (consentStatus === null) {
      setTimeout(() => setIsVisible(true), 1200);
    }
  }, []);

  const handleAccept = () => {
    updateConsent(true);
    dismiss();
  };

  const handleReject = () => {
    updateConsent(false);
    dismiss();
  };

  const dismiss = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 350);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6 transition-all duration-350 ease-in-out ${
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
              <p className="text-white font-semibold text-sm">{t('cookieBanner.title')}</p>
              <p className="text-gray-400 text-xs leading-relaxed mt-0.5 line-clamp-2">
                {t('cookieBanner.description')}
              </p>
            </div>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              {t('cookieBanner.rejectAll')}
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-2 rounded-full text-xs font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all duration-200 shadow-lg shadow-orange-500/20"
            >
              {t('cookieBanner.acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
