import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import revillionLogo from '@/assets/revillion-logo.png?format=webp&quality=85&w=170';

export const Footer = () => {
  const { t } = useTranslation();
  const { lang } = useParams();

  return (
    <footer className="bg-[#0a0a0a] text-gray-300 relative overflow-hidden">
      {/* Top CTA band */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
                Ready to start earning?
              </h3>
              <p className="text-gray-400 mt-1 text-base">Join 800+ affiliates already growing with Revillion.</p>
            </div>
            <a
              href="https://dashboard.revillion.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-sm rounded-full px-7 py-3.5 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 whitespace-nowrap"
            >
              Become an Affiliate
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <img
              src={revillionLogo}
              alt="Revillion Partners"
              className="h-10 w-auto mb-4"
              width="170"
              height="48"
            />
            <p className="text-gray-500 leading-relaxed text-sm mb-5">
              {t('footer.description')}
            </p>
            <a href="mailto:info@revillion.com" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors text-sm">
              <Mail className="w-4 h-4" />
              info@revillion.com
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2.5">
              {[
                { to: `/${lang}`, label: t('nav.home'), isLink: true },
                { to: `/${lang}#why-join`, label: t('nav.whyJoin') },
                { to: `/${lang}#tools`, label: t('nav.tools') },
                { to: `/${lang}#offers`, label: t('nav.offers') },
                { to: `/${lang}#faq`, label: t('nav.faq') },
              ].map(({ to, label, isLink }) =>
                <li key={to}>
                  {isLink ? (
                    <Link to={to} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                      {label}
                    </Link>
                  ) : (
                    <a href={to} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                      {label}
                    </a>
                  )}
                </li>
              )}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Resources</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to={`/${lang}/blog`} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/calculator`} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                  Calculator
                </Link>
              </li>
              <li>
                <Link
                  to={`/${lang}/contact`}
                  className="text-gray-500 hover:text-orange-400 transition-colors text-sm"
                  onClick={(e) => {
                    if (window.location.pathname.includes('/contact')) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">{t('footer.legal')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to={`/${lang}/privacy-policy`} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/terms-of-service`} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/responsible-gaming`} className="text-gray-500 hover:text-orange-400 transition-colors text-sm">
                  {t('footer.responsibleGaming')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            {t('footer.copyright')}
          </p>
          <p className="text-gray-500 text-xs">
            18+ | Gamble Responsibly
          </p>
        </div>
      </div>
    </footer>
  );
};
