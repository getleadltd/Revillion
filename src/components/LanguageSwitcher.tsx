import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

  const changeLanguage = async (langCode: string) => {
    i18n.changeLanguage(langCode);
    
    const currentPath = location.pathname;
    
    // If we're on a blog post, redirect to the translated slug
    if (currentPath.includes('/blog/') && !currentPath.endsWith('/blog')) {
      const slugMatch = currentPath.match(/\/blog\/([^/]+)$/);
      if (slugMatch) {
        const currentSlug = slugMatch[1];
        
        // Find the post with this slug in the current language
        let query = supabase
          .from('blog_posts')
          .select('slug_en, slug_de, slug_it, slug_pt, slug_es');
        
        // Apply the correct slug filter based on current language
        switch (lang) {
          case 'en':
            query = query.eq('slug_en', currentSlug);
            break;
          case 'de':
            query = query.eq('slug_de', currentSlug);
            break;
          case 'it':
            query = query.eq('slug_it', currentSlug);
            break;
          case 'pt':
            query = query.eq('slug_pt', currentSlug);
            break;
          case 'es':
            query = query.eq('slug_es', currentSlug);
            break;
          default:
            query = query.eq('slug_en', currentSlug);
        }
        
        const { data: post } = await query.single();
        
        if (post) {
          // Get the slug in the new language
          const newSlug = (langCode === 'en' && post.slug_en) ||
                          (langCode === 'de' && post.slug_de) ||
                          (langCode === 'it' && post.slug_it) ||
                          (langCode === 'pt' && post.slug_pt) ||
                          (langCode === 'es' && post.slug_es) ||
                          post.slug_en;
          
          if (newSlug) {
            navigate(`/${langCode}/blog/${newSlug}`);
            return;
          }
        }
      }
    }
    
    // Otherwise, normal behavior
    const pathWithoutLang = currentPath.replace(`/${lang}`, '');
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
