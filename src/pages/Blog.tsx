import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Loader2 } from 'lucide-react';

const Blog = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: posts, isLoading } = useBlogPosts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    lang: lang as string,
  });

  return (
    <>
      <Helmet>
        <title>{t('blog.title')} | Revillion Partners</title>
        <meta name="description" content={t('blog.subtitle')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <BlogHero />
        
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-1/4">
              <BlogSidebar
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </aside>

            {/* Main Content */}
            <main className="lg:w-3/4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !posts || posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{t('blog.noPosts')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} lang={lang} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
