import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SlugMapping {
  slug_en: string | null;
  slug_de: string | null;
  slug_it: string | null;
  slug_pt: string | null;
  slug_es: string | null;
  slug: string;
}

const VALID_LANGS = ['en', 'de', 'it', 'pt', 'es'];

/**
 * Hook to process HTML content and replace internal blog links with correct language-specific slugs
 * Handles both relative links (/blog/...) and absolute links (https://revillion-partners.com/xx/blog/...)
 */
export function useProcessedContent(htmlContent: string, lang: string) {
  // Validate lang - fallback to 'en' if invalid (e.g., ":lang" literal)
  const safeLang = VALID_LANGS.includes(lang) ? lang : 'en';
  
  const [processedContent, setProcessedContent] = useState(htmlContent);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function processLinks() {
      if (!htmlContent) {
        setProcessedContent('');
        return;
      }

      setIsProcessing(true);

      try {
        // Find all internal blog links - both relative and absolute
        const relativePattern = /href="\/blog\/([^"]+)"/g;
        const absolutePattern = /href="https:\/\/revillion-partners\.com\/(en|de|it|pt|es)\/blog\/([^"]+)"/g;

        // Collect all slugs that need lookup
        const slugsToLookup = new Set<string>();
        
        let match;
        while ((match = relativePattern.exec(htmlContent)) !== null) {
          slugsToLookup.add(match[1]);
        }
        
        // Reset regex lastIndex
        absolutePattern.lastIndex = 0;
        while ((match = absolutePattern.exec(htmlContent)) !== null) {
          slugsToLookup.add(match[2]); // match[2] is the slug
        }

        if (slugsToLookup.size === 0) {
          // No internal links found, just return original content with basic processing
          const result = htmlContent.replace(/href="\/blog\//g, `href="/${safeLang}/blog/`);
          setProcessedContent(result);
          setIsProcessing(false);
          return;
        }

        // Query database for all slugs at once
        const slugArray = Array.from(slugsToLookup);
        
        // Query using OR conditions on all slug fields
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('slug, slug_en, slug_de, slug_it, slug_pt, slug_es')
          .or(
            slugArray.map(s => 
              `slug.eq.${s},slug_en.eq.${s},slug_de.eq.${s},slug_it.eq.${s},slug_pt.eq.${s},slug_es.eq.${s}`
            ).join(',')
          );

        if (error) {
          console.error('Error fetching slugs:', error);
          // Fallback to basic processing
          const result = htmlContent
            .replace(/href="\/blog\//g, `href="/${safeLang}/blog/`)
            .replace(
              /href="https:\/\/revillion-partners\.com\/(en|de|it|pt|es)\/blog\//g,
              `href="https://revillion-partners.com/${safeLang}/blog/`
            );
          setProcessedContent(result);
          setIsProcessing(false);
          return;
        }

        // Build a mapping from any slug to the correct slug for current language
        const slugMapping = new Map<string, string>();
        
        for (const post of (posts || [])) {
          const targetSlugKey = `slug_${safeLang}` as keyof SlugMapping;
          const targetSlug = (post[targetSlugKey] as string | null) || post.slug_en || post.slug;
          
          // Map all known slugs for this post to the target slug
          const allSlugs = [
            post.slug,
            post.slug_en,
            post.slug_de,
            post.slug_it,
            post.slug_pt,
            post.slug_es
          ].filter(Boolean) as string[];
          
          for (const s of allSlugs) {
            slugMapping.set(s, targetSlug);
          }
        }

        // Replace all links with correct language and slug
        let result = htmlContent;

        // Replace relative links
        result = result.replace(/href="\/blog\/([^"]+)"/g, (fullMatch, oldSlug) => {
          const newSlug = slugMapping.get(oldSlug) || oldSlug;
          return `href="/${safeLang}/blog/${newSlug}"`;
        });

        // Replace absolute links
        result = result.replace(
          /href="https:\/\/revillion-partners\.com\/(en|de|it|pt|es)\/blog\/([^"]+)"/g,
          (fullMatch, oldLang, oldSlug) => {
            const newSlug = slugMapping.get(oldSlug) || oldSlug;
            return `href="https://revillion-partners.com/${safeLang}/blog/${newSlug}"`;
          }
        );

        setProcessedContent(result);
      } catch (error) {
        console.error('Error processing content links:', error);
        // Fallback to basic processing
        const result = htmlContent
          .replace(/href="\/blog\//g, `href="/${safeLang}/blog/`)
          .replace(
            /href="https:\/\/revillion-partners\.com\/(en|de|it|pt|es)\/blog\//g,
            `href="https://revillion-partners.com/${safeLang}/blog/`
          );
        setProcessedContent(result);
      } finally {
        setIsProcessing(false);
      }
    }

    processLinks();
  }, [htmlContent, safeLang]);

  return { processedContent, isProcessing };
}
