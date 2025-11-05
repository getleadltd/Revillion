import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseRelatedPostsParams {
  category: string;
  currentPostId: string;
  lang: string;
  limit?: number;
}

export const useRelatedPosts = ({ category, currentPostId, lang, limit = 3 }: UseRelatedPostsParams) => {
  return useQuery({
    queryKey: ['related-posts', category, currentPostId, lang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('category', category)
        .neq('id', currentPostId)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};
