import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const location = useLocation();

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    
    // Estrai il percorso corrente senza la lingua
    const currentPath = location.pathname;
    const pathWithoutLang = currentPath.replace(`/${lang}`, '');
    
    // Naviga alla stessa pagina nella nuova lingua
    navigate(`/${langCode}${pathWithoutLang}`);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
        <Globe size={18} className="text-gray-600" />
        <span className="font-medium text-gray-800 text-sm md:text-base">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {languages.map(lang => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-orange-50' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
