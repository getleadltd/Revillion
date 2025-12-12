import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getConsentStatus, updateConsent } from '@/lib/consentMode';

export const CookieBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show banner only if user hasn't made a choice yet
    const consentStatus = getConsentStatus();
    if (consentStatus === null) {
      // Small delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    updateConsent(true);
    closeBanner();
  };

  const handleReject = () => {
    updateConsent(false);
    closeBanner();
  };

  const closeBanner = () => {
    // Treat closing without explicit choice as rejection (GDPR compliant)
    updateConsent(false);
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-lg border border-border bg-card p-6 shadow-2xl backdrop-blur-sm">
          <button
            onClick={closeBanner}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4 pr-8">
              <div className="hidden sm:flex items-start">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {t('cookieBanner.title')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('cookieBanner.description')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={handleReject}
                className="w-full sm:w-auto"
              >
                {t('cookieBanner.rejectAll')}
              </Button>
              
              <Button
                onClick={handleAccept}
                className="w-full sm:w-auto"
              >
                {t('cookieBanner.acceptAll')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
