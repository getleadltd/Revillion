import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseBlogPostsParams {
  category?: string;
  page?: number;
  limit?: number;
  lang: string;
}

export const useBlogPosts = ({ category, page = 1, limit = 9, lang }: UseBlogPostsParams) => {
  return useQuery({
    queryKey: ['blog-posts', category, page, lang],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

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
