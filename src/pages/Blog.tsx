import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Layout } from '@/components/layout/Layout';
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

  // Dynamic meta description based on category
  const getMetaDescription = () => {
    if (selectedCategory === 'all') {
      return t('blog.subtitle');
    }
    return `${t(`blog.categories.${selectedCategory}`)} - ${t('blog.subtitle')}`;
  };

  const currentUrl = `https://revillion-partners.com/${lang}/blog`;

  return (
    <Layout>
      <Helmet>
        <title>{t('blog.title')} | Revillion Partners</title>
        <meta name="description" content={getMetaDescription()} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
        
        {/* Hreflang Tags */}
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/blog" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/blog" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/blog" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/blog" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/blog" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/blog" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${t('blog.title')} | Revillion Partners`} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:locale" content={lang} />
        <meta property="og:locale:alternate" content="en" />
        <meta property="og:locale:alternate" content="de" />
        <meta property="og:locale:alternate" content="it" />
        <meta property="og:locale:alternate" content="pt" />
        <meta property="og:locale:alternate" content="es" />
      </Helmet>

      <div className="bg-background py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4 md:mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t('blog.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('blog.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
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
    </Layout>
  );
};

export default Blog;
