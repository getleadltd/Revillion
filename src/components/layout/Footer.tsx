import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import revillionLogo from '@/assets/revillion-logo.png?format=webp&quality=85&w=170';

export const Footer = () => {
  const { t } = useTranslation();
  const { lang } = useParams();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Colonna 1 - Brand & Descrizione */}
          <div>
            <img 
              src={revillionLogo} 
              alt="Revillion Partners" 
              className="h-10 w-auto mb-4"
              width="170"
              height="48"
            />
            <p className="text-gray-400 leading-relaxed mb-6">
              {t('footer.description')}
            </p>
          </div>

          {/* Colonna 2 - Link Utili */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to={`/${lang}`} className="hover:text-orange-400 transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <a href={`/${lang}#why-join`} className="hover:text-orange-400 transition-colors">
                  {t('nav.whyJoin')}
                </a>
              </li>
              <li>
                <a href={`/${lang}#tools`} className="hover:text-orange-400 transition-colors">
                  {t('nav.tools')}
                </a>
              </li>
              <li>
                <a href={`/${lang}#offers`} className="hover:text-orange-400 transition-colors">
                  {t('nav.offers')}
                </a>
              </li>
              <li>
                <a href={`/${lang}#faq`} className="hover:text-orange-400 transition-colors">
                  {t('nav.faq')}
                </a>
              </li>
              <li>
                <Link 
                  to={`/${lang}/contact`} 
                  className="hover:text-orange-400 transition-colors"
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
              <li>
                <Link to={`/${lang}/blog`} className="hover:text-orange-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonna 3 - Legal & Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  {t('footer.privacyPolicy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  {t('footer.termsOfService')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-400 transition-colors">
                  {t('footer.responsibleGaming')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-800 pt-8">
          <div className="text-center text-gray-400 text-sm">
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
};
