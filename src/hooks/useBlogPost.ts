import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBlogPost = (slug: string, lang: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['blog-post', slug, lang],
    queryFn: async () => {
      // Validate slug format to prevent SQL injection - only allow valid slug characters
      const slugPattern = /^[a-z0-9-]+$/;
      if (!slugPattern.test(slug)) {
        throw new Error('Invalid slug format');
      }
      
      // Validate lang parameter
      const validLangs = ['en', 'de', 'it', 'pt', 'es'];
      const safeLang = validLangs.includes(lang) ? lang : 'en';
      
      // Try to find post by language-specific slug with fallback to all other slugs
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .or(`slug_${safeLang}.eq.${slug},slug_de.eq.${slug},slug_pt.eq.${slug},slug_es.eq.${slug},slug_it.eq.${slug},slug_en.eq.${slug},slug.eq.${slug}`)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Post not found');
      
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
