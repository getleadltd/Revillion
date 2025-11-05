import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBlogPost = (slug: string, lang: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['blog-post', slug, lang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
  });

  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      if (!query.data?.id) return;

      // Update views count
      const { error } = await supabase
        .from('blog_posts')
        .update({ views: (query.data.views || 0) + 1 })
        .eq('id', query.data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-post', slug, lang] });
    },
  });

  return {
    ...query,
    incrementViews: incrementViewsMutation.mutate,
  };
};
