import { BlogPost } from '@/data/blogPosts';
import { BlogCard } from './BlogCard';
import { useTranslation } from 'react-i18next';

interface RelatedPostsProps {
  posts: BlogPost[];
  lang: string;
}

export const RelatedPosts = ({ posts, lang }: RelatedPostsProps) => {
  const { t } = useTranslation();

  if (posts.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
          {t('blog.relatedPosts')}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
};
