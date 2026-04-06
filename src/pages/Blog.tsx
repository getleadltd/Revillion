import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Layout } from '@/components/layout/Layout';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useBlogPosts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    lang: lang as string,
  });

  const posts = data?.posts;
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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
        <title>{t('blog.metaTitle')}</title>
        <meta name="description" content={t('blog.metaDescription')} />

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
        <meta property="og:title" content={t('blog.metaTitle')} />
        <meta property="og:description" content={t('blog.metaDescription')} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:site_name" content="Revillion" />
        <meta property="og:locale" content={lang === 'de' ? 'de_DE' : lang === 'it' ? 'it_IT' : lang === 'pt' ? 'pt_BR' : lang === 'es' ? 'es_ES' : 'en_US'} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@revillion" />
        <meta name="twitter:title" content={t('blog.metaTitle')} />
        <meta name="twitter:description" content={t('blog.metaDescription')} />
        <meta name="twitter:image" content="https://revillion-partners.com/og-image.png" />
      </Helmet>

      {/* Dark Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-5 text-xs font-semibold tracking-wider uppercase rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {t('blog.title')}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
              {t('blog.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Strategies, insights, and tips to maximize your affiliate earnings
            </p>
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span>Search articles, guides, and reviews...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar / Mobile pills */}
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} lang={lang} />
                  ))}
                </div>

                {/* CTA Banner */}
                <div className="my-10 rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
                  <div className="relative px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/5" />
                    <div className="relative z-10 text-center md:text-left">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        Ready to start earning?
                      </h3>
                      <p className="text-gray-400">
                        Join 800+ affiliates today and get access to top-converting offers.
                      </p>
                    </div>
                    <div className="relative z-10 flex-shrink-0">
                      <a
                        href="https://dashboard.revillion.com/en/registration"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="lg"
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg shadow-orange-500/20"
                        >
                          Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          aria-label={t('blog.pagination.previous')}
                        >
                          {t('blog.pagination.previous')}
                        </PaginationPrevious>
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          aria-label={t('blog.pagination.next')}
                        >
                          {t('blog.pagination.next')}
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
