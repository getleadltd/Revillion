import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
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
          <nav className="hidden md:flex space-x-8 items-center">
            <a 
              href={`/${lang}#hero`}
              onClick={(e) => handleNavClick(e, 'hero')}
              className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
            >
              {t('nav.home')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href={`/${lang}#why-join`}
              onClick={(e) => handleNavClick(e, 'why-join')}
              className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
            >
              {t('nav.whyJoin')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href={`/${lang}#tools`}
              onClick={(e) => handleNavClick(e, 'tools')}
              className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
            >
              {t('nav.tools')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href={`/${lang}#offers`}
              onClick={(e) => handleNavClick(e, 'offers')}
              className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
            >
              {t('nav.offers')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a 
              href={`/${lang}#faq`}
              onClick={(e) => handleNavClick(e, 'faq')}
              className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
            >
              {t('nav.faq')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <Link 
              to={`/${lang}/blog`}
              className="text-gray-800 hover:text-orange-500 transition-all duration-300 font-semibold relative group"
            >
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <LanguageSwitcher />
          </nav>

          {/* Mobile: Language Switcher + Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <button 
              className="text-gray-800 hover:text-orange-500 transition-colors"
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
          <nav id="mobile-navigation" className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col space-y-4">
              <a 
                href={`/${lang}#hero`}
                onClick={(e) => handleNavClick(e, 'hero')}
                className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
              >
                {t('nav.home')}
              </a>
              <a 
                href={`/${lang}#why-join`}
                onClick={(e) => handleNavClick(e, 'why-join')}
                className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
              >
                {t('nav.whyJoin')}
              </a>
              <a 
                href={`/${lang}#tools`}
                onClick={(e) => handleNavClick(e, 'tools')}
                className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
              >
                {t('nav.tools')}
              </a>
              <a 
                href={`/${lang}#offers`}
                onClick={(e) => handleNavClick(e, 'offers')}
                className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
              >
                {t('nav.offers')}
              </a>
              <a 
                href={`/${lang}#faq`}
                onClick={(e) => handleNavClick(e, 'faq')}
                className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
              >
                {t('nav.faq')}
              </a>
              <Link 
                to={`/${lang}/blog`}
                className="text-gray-800 hover:text-orange-500 transition-colors font-semibold text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
