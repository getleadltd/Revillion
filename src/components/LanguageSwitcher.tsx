import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSiteLanguage, SITE_LANGUAGES } from '@/lib/dashboard';
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
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const location = useLocation();
  const currentPathLanguage = getSiteLanguage(lang || location.pathname.split('/')[1]);

  const changeLanguage = async (langCode: string) => {
    i18n.changeLanguage(langCode);
    
    const currentPath = location.pathname;
    
    // If we're on a blog post, redirect to the translated slug
    if (currentPath.includes('/blog/') && !currentPath.endsWith('/blog')) {
      const slugMatch = currentPath.match(/\/blog\/([^/]+)$/);
      if (slugMatch) {
        const currentSlug = slugMatch[1];
        
        // Validate slug format to prevent SQL injection
        const slugPattern = /^[a-z0-9-]+$/;
        if (!slugPattern.test(currentSlug)) {
          // Invalid slug, navigate without translation lookup
          const pathWithoutLang = currentPath.replace(`/${currentPathLanguage}`, '');
          navigate(`/${langCode}${pathWithoutLang}`);
          return;
        }
        
        // Find the post with this slug in any language (robust fallback)
        const { data: post } = await supabase
          .from('blog_posts')
          .select('slug, slug_en, slug_de, slug_it, slug_pt, slug_es')
          .or(`slug_en.eq.${currentSlug},slug_de.eq.${currentSlug},slug_it.eq.${currentSlug},slug_pt.eq.${currentSlug},slug_es.eq.${currentSlug},slug.eq.${currentSlug}`)
          .maybeSingle();
        
        if (post) {
          // Try to get the slug in the new language, prefer en over it for non-Italian
          const newSlug = post[`slug_${langCode}` as keyof typeof post] || 
                         (langCode !== 'it' ? post.slug_en : undefined) ||
                         post.slug_it || 
                         post.slug_en || 
                         post.slug;
          
          if (newSlug) {
            navigate(`/${langCode}/blog/${newSlug as string}`);
            return;
          }
        }
      }
    }
    
    // Otherwise, normal behavior
    const firstSegment = currentPath.split('/')[1];
    const pathWithoutLang = SITE_LANGUAGES.includes(firstSegment as (typeof SITE_LANGUAGES)[number])
      ? currentPath.replace(`/${firstSegment}`, '')
      : currentPath;
    navigate(`/${langCode}${pathWithoutLang}`);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('accessibility.changeLanguage', { language: currentLang.name })}
        className="flex items-center gap-1 px-1.5 sm:px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <Globe size={16} className="text-gray-400 sm:w-[18px] sm:h-[18px]" />
        <span className="font-medium text-gray-300 text-xs sm:text-sm md:text-base">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
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
