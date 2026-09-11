import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { getDashboardUrl, getSiteLanguage } from '@/lib/dashboard';
import { OPEN_COOKIE_SETTINGS_EVENT } from '@/lib/consentMode';
import revillionLogo from '@/assets/revillion-logo.png?format=webp&quality=85&w=170';

export const Footer = () => {
  const { t } = useTranslation();
  const { lang: routeLanguage } = useParams();
  const location = useLocation();
  const lang = getSiteLanguage(routeLanguage || location.pathname.split('/')[1]);
  const currentYear = new Date().getFullYear();
  const registrationUrl = getDashboardUrl(lang, 'registration');
  const loginUrl = getDashboardUrl(lang, 'login');

  return (
    <footer className="bg-[#0a0a0a] text-gray-300 relative overflow-hidden">
      {/* Top CTA band */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
                {t('blog.cta.title')}
              </h3>
              <p className="text-gray-400 mt-1 text-base">{t('blog.cta.description')}</p>
            </div>
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-gray-950 font-bold text-sm rounded-full px-7 py-3.5 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
            >
              {t('blog.cta.button')}
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
            <p className="text-gray-400 leading-relaxed text-sm mb-5">
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
                    <Link to={to} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                      {label}
                    </Link>
                  ) : (
                    <a href={to} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                      {label}
                    </a>
                  )}
                </li>
              )}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">{t('footer.resources')}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to={`/${lang}/blog`} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {t('nav.blog')}
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/calculator`} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {t('nav.calculator')}
                </Link>
              </li>
              <li>
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  {t('nav.login')}
                </a>
              </li>
              <li>
                <Link
                  to={`/${lang}/contact`}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
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
                <Link to={`/${lang}/privacy-policy`} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/terms-of-service`} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to={`/${lang}/responsible-gaming`} className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {t('footer.responsibleGaming')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
                >
                  {t('footer.cookieSettings')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <p className="text-gray-400 text-xs">
            {t('footer.responsibleNotice')}
          </p>
        </div>
      </div>
    </footer>
  );
};
