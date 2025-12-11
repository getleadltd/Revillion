import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useIncomingArticlesCount() {
  return useQuery({
    queryKey: ['incoming-articles-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
        .eq('source', 'babylovegrowth');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
