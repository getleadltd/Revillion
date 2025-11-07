import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBlogPost = (slug: string, lang: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['blog-post', slug, lang],
    queryFn: async () => {
      // Build the query dynamically based on language
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published');

      // Use the appropriate slug column based on language
      switch (lang) {
        case 'en':
          query = query.eq('slug_en', slug);
          break;
        case 'de':
          query = query.eq('slug_de', slug);
          break;
        case 'it':
          query = query.eq('slug_it', slug);
          break;
        case 'pt':
          query = query.eq('slug_pt', slug);
          break;
        case 'es':
          query = query.eq('slug_es', slug);
          break;
        default:
          query = query.eq('slug_en', slug);
      }

      const { data, error } = await query.single();

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
