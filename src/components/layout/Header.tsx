import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import revillionLogo from '@/assets/revillion-logo.png?format=webp&quality=85&w=170';

interface HeaderProps {
  showScrollLinks?: boolean;
}

export const Header = ({ showScrollLinks = false }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    } else {
      // If element doesn't exist (we're on another page), navigate to home with hash
      navigate(`/${lang}#${sectionId}`);
      setIsMenuOpen(false);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (showScrollLinks) {
      e.preventDefault();
      scrollToSection(sectionId);
    } else {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-[#0a0a0a]/95 backdrop-blur-md sticky top-0 z-50 border-b border-white/8">
      <div className="container mx-auto px-6 max-w-7xl py-4">
        <div className="flex justify-between items-center">
          <Link to={`/${lang}`}>
            <img 
              src={revillionLogo} 
              alt="Revillion Logo" 
              width="170"
              height="48"
              className="h-12 w-auto"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: `/${lang}#hero`, id: 'hero', label: t('nav.home') },
              { href: `/${lang}#why-join`, id: 'why-join', label: t('nav.whyJoin') },
              { href: `/${lang}#tools`, id: 'tools', label: t('nav.tools') },
              { href: `/${lang}#offers`, id: 'offers', label: t('nav.offers') },
              { href: `/${lang}#faq`, id: 'faq', label: t('nav.faq') },
            ].map(({ href, id, label }) => (
              <a
                key={id}
                href={href}
                onClick={(e) => handleNavClick(e, id)}
                className="text-gray-400 hover:text-white transition-colors duration-200 font-medium relative group text-[13px] tracking-wide px-3 py-2 rounded-lg hover:bg-white/5"
              >
                {label}
              </a>
            ))}
            <Link
              to={`/${lang}/calculator`}
              className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-200 font-semibold text-[13px] rounded-full px-4 py-1.5 ml-1"
            >
              <span>💰</span> Calculator
            </Link>
            <Link
              to={`/${lang}/contact`}
              className="text-gray-400 hover:text-white transition-colors duration-200 font-medium text-[13px] tracking-wide px-3 py-2 rounded-lg hover:bg-white/5"
            >
              {t('nav.contact')}
            </Link>
            <Link
              to={`/${lang}/blog`}
              className="text-gray-400 hover:text-white transition-colors duration-200 font-medium text-[13px] tracking-wide px-3 py-2 rounded-lg hover:bg-white/5"
            >
              Blog
            </Link>
            <div className="ml-2 mr-3">
              <LanguageSwitcher />
            </div>
            <a
              href="https://dashboard.revillion.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group/cta flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-[13px] rounded-full px-5 py-2 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03]"
            >
              Start Earning
              <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform duration-200" />
            </a>
          </nav>

          {/* Mobile: Language Switcher + Menu Button */}
          <div className="flex lg:hidden items-center gap-3">
            <LanguageSwitcher />
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav id="mobile-navigation" className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col space-y-4">
              <a
                href={`/${lang}#hero`}
                onClick={(e) => handleNavClick(e, 'hero')}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
              >
                {t('nav.home')}
              </a>
              <a
                href={`/${lang}#why-join`}
                onClick={(e) => handleNavClick(e, 'why-join')}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
              >
                {t('nav.whyJoin')}
              </a>
              <a
                href={`/${lang}#tools`}
                onClick={(e) => handleNavClick(e, 'tools')}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
              >
                {t('nav.tools')}
              </a>
              <a
                href={`/${lang}#offers`}
                onClick={(e) => handleNavClick(e, 'offers')}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
              >
                {t('nav.offers')}
              </a>
              <a
                href={`/${lang}#faq`}
                onClick={(e) => handleNavClick(e, 'faq')}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
              >
                {t('nav.faq')}
              </a>
              <Link
                to={`/${lang}/calculator`}
                className="text-orange-400 hover:text-orange-300 transition-colors font-semibold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                💰 Calculator
              </Link>
              <Link
                to={`/${lang}/contact`}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.contact')}
              </Link>
              <Link
                to={`/${lang}/blog`}
                className="text-gray-400 hover:text-white transition-colors font-semibold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <a
                href="https://dashboard.revillion.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm rounded-full px-5 py-3 mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Start Earning
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
