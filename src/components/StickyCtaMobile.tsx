import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { trackCTAClick } from '@/lib/analytics';

export const StickyCtaMobile = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (!dismissed) {
        setVisible(window.scrollY > 500);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-black/80 to-transparent animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50">
        <a
          href="https://dashboard.revillion.com/en/registration"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCTAClick('sticky_cta_mobile')}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm rounded-xl py-3 shadow-lg shadow-orange-500/20"
        >
          Start Earning Now
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
