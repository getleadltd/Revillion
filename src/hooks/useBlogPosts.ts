import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseBlogPostsParams {
  category?: string;
  page?: number;
  limit?: number;
  lang: string;
  search?: string;
}

const SEARCH_COLUMNS = {
  de: 'title_de',
  en: 'title_en',
  es: 'title_es',
  it: 'title_it',
  pt: 'title_pt',
} as const;

type SupportedLanguage = keyof typeof SEARCH_COLUMNS;

const getSearchColumn = (lang: string) => {
  const normalizedLang = lang.toLowerCase().split('-')[0];
  const safeLang: SupportedLanguage = Object.prototype.hasOwnProperty.call(
    SEARCH_COLUMNS,
    normalizedLang,
  )
    ? (normalizedLang as SupportedLanguage)
    : 'en';

  return SEARCH_COLUMNS[safeLang];
};

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

export const useBlogPosts = ({
  category,
  page = 1,
  limit = 9,
  lang,
  search,
}: UseBlogPostsParams) => {
  const normalizedSearch = search?.trim().slice(0, 100) || '';
  const searchColumn = getSearchColumn(lang);
  const searchPattern = `%${escapeLikePattern(normalizedSearch)}%`;

  return useQuery({
    queryKey: ['blog-posts', category, page, limit, searchColumn, normalizedSearch],
    queryFn: async () => {
      // Build base query for counting
      let countQuery = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (category && category !== 'all') {
        countQuery = countQuery.eq('category', category);
      }

      if (normalizedSearch) {
        countQuery = countQuery.ilike(searchColumn, searchPattern);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      // Build query for fetching posts
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (normalizedSearch) {
        query = query.ilike(searchColumn, searchPattern);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query.range(from, to);

      if (error) throw error;
      return { posts: data, totalCount: count || 0 };
    },
  });
};
