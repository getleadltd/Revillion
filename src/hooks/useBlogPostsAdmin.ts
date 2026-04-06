import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseBlogPostsAdminParams {
  category?: string;
  page?: number;
  limit?: number;
  lang: string;
  statusFilter?: 'all' | 'published' | 'draft';
  search?: string;
}

export const useBlogPostsAdmin = ({
  category,
  page = 1,
  limit = 20,
  lang,
  statusFilter = 'all',
  search = '',
}: UseBlogPostsAdminParams) => {
  return useQuery({
    queryKey: ['blog-posts-admin', category, page, lang, statusFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter === 'published') {
        query = query.eq('status', 'published');
      } else if (statusFilter === 'draft') {
        query = query.eq('status', 'draft');
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search.trim()) {
        const s = search.trim().replace(/[%_'"\\]/g, '');
        query = query.or(`title_en.ilike.%${s}%,title_it.ilike.%${s}%,slug.ilike.%${s}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return { posts: data ?? [], total: count ?? 0 };
    },
  });
};
