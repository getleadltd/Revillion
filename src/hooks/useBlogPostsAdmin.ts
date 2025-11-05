import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseBlogPostsAdminParams {
  category?: string;
  page?: number;
  limit?: number;
  lang: string;
  statusFilter?: 'all' | 'published' | 'draft';
}

export const useBlogPostsAdmin = ({ 
  category, 
  page = 1, 
  limit = 100, 
  lang,
  statusFilter = 'all' 
}: UseBlogPostsAdminParams) => {
  return useQuery({
    queryKey: ['blog-posts-admin', category, page, lang, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by status if not 'all'
      if (statusFilter === 'published') {
        query = query.eq('status', 'published');
      } else if (statusFilter === 'draft') {
        query = query.eq('status', 'draft');
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query.range(from, to);

      if (error) throw error;
      return data;
    },
  });
};
