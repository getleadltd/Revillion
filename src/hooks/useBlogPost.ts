import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const VALID_LANGS = ['en', 'de', 'it', 'pt', 'es'];

export const useBlogPost = (slug: string, lang: string) => {
  const queryClient = useQueryClient();
  
  // Validate lang - fallback to 'en' if invalid (e.g., ":lang" literal)
  const safeLang = VALID_LANGS.includes(lang) ? lang : 'en';

  const query = useQuery({
    queryKey: ['blog-post', slug, safeLang],
    queryFn: async () => {
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
      queryClient.invalidateQueries({ queryKey: ['blog-post', slug, safeLang] });
    },
  });

  return {
    ...query,
    incrementViews: incrementViewsMutation.mutate,
  };
};
