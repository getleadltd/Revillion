import { useTranslation } from 'react-i18next';
import { useRelatedPosts } from '@/hooks/useRelatedPosts';
import { BlogCard } from './BlogCard';
import { Loader2 } from 'lucide-react';

interface RelatedPostsProps {
  category: string;
  currentPostId: string;
  lang: string;
}

export const RelatedPosts = ({ category, currentPostId, lang }: RelatedPostsProps) => {
  const { t } = useTranslation();
  const { data: posts, isLoading } = useRelatedPosts({ category, currentPostId, lang });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">{t('blog.relatedPosts')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} lang={lang} />
        ))}
      </div>
    </section>
  );
};
