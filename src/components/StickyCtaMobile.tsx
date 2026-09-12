import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { trackCTAClick } from '@/lib/analytics';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDashboardUrl } from '@/lib/dashboard';
import {
  CONSENT_CHANGE_EVENT,
  getConsentStatus,
  OPEN_COOKIE_SETTINGS_EVENT,
} from '@/lib/consentMode';

export const StickyCtaMobile = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(
    () => getConsentStatus() === null,
  );

  useEffect(() => {
    const onScroll = () => {
      if (!dismissed) {
        setVisible(window.scrollY > 500);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  useEffect(() => {
    const handleOpenSettings = () => setCookieSettingsOpen(true);
    const handleConsentChange = () => setCookieSettingsOpen(false);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
      window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
    };
  }, []);

  if (dismissed || !visible || cookieSettingsOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-black/80 to-transparent animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50">
        <a
          href={getDashboardUrl(lang, 'registration')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCTAClick('sticky_cta_mobile')}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-gray-950 font-bold text-sm rounded-xl py-3 shadow-lg shadow-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {t('nav.startEarning')}
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-200 transition-colors p-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label={t('accessibility.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
