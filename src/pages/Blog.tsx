import { useState, useEffect, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Layout } from '@/components/layout/Layout';
import { Loader2, ArrowRight, Search } from 'lucide-react';
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
const SUPPORTED_LANGUAGES = ['de', 'en', 'es', 'it', 'pt'] as const;
const OG_LOCALES: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  de: 'de_DE',
  en: 'en_US',
  es: 'es_ES',
  it: 'it_IT',
  pt: 'pt_PT',
};

const getSafeLanguage = (lang: string) => {
  const normalizedLang = lang.toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(
    normalizedLang as (typeof SUPPORTED_LANGUAGES)[number],
  )
    ? (normalizedLang as (typeof SUPPORTED_LANGUAGES)[number])
    : 'en';
};

const Blog = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const safeLang = getSafeLanguage(lang);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading, isError } = useBlogPosts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    lang: safeLang,
    search: debouncedSearch,
  });

  const posts = data?.posts;
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  // Debounce search requests while keeping pagination in sync with the visible filter.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [safeLang]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSearchTerm = event.target.value;
    setSearchTerm(nextSearchTerm);
    setCurrentPage(1);

    if (!nextSearchTerm.trim()) {
      setDebouncedSearch('');
    }
  };

  // Dynamic meta description based on category
  const getMetaDescription = () => {
    if (selectedCategory === 'all') {
      return t('blog.metaDescription');
    }
    return `${t(`blog.categories.${selectedCategory}`)} - ${t('blog.subtitle')}`;
  };

  const metaDescription = getMetaDescription();
  const currentUrl = `https://revillion-partners.com/${safeLang}/blog`;

  return (
    <Layout>
      <Helmet>
        <title>{t('blog.metaTitle')}</title>
        <meta name="description" content={metaDescription} />

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
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:site_name" content="Revillion" />
        <meta property="og:locale" content={OG_LOCALES[safeLang]} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@revillion" />
        <meta name="twitter:title" content={t('blog.metaTitle')} />
        <meta name="twitter:description" content={metaDescription} />
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
              {t('blog.subtitle')}
            </p>
            <div className="mt-8 flex justify-center">
              <form
                role="search"
                className="relative w-full max-w-xl"
                onSubmit={(event) => event.preventDefault()}
              >
                <label htmlFor="blog-search" className="sr-only">
                  {t('blog.searchLabel')}
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="blog-search"
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  maxLength={100}
                  autoComplete="off"
                  aria-controls="blog-results"
                  placeholder={t('blog.searchPlaceholder')}
                  className="w-full rounded-full border border-white/15 bg-white/5 py-3 pl-12 pr-5 text-sm text-white placeholder:text-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </form>
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
              onCategoryChange={handleCategoryChange}
            />
          </aside>

          {/* Main Content */}
          <section
            id="blog-results"
            aria-label={t('blog.resultsLabel')}
            className="lg:w-3/4"
          >
            <p className="sr-only" role="status" aria-live="polite">
              {isLoading
                ? t('blog.loading')
                : isError
                  ? t('blog.loadError')
                  : t('blog.resultsFound', { count: totalCount })}
            </p>

            {isLoading ? (
              <div className="flex justify-center py-12" aria-hidden="true">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="py-12 text-center" role="alert">
                <p className="text-muted-foreground">{t('blog.loadError')}</p>
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {debouncedSearch
                    ? t('blog.noSearchResults', { query: debouncedSearch })
                    : t('blog.noPosts')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} lang={safeLang} />
                  ))}
                </div>

                {/* CTA Banner */}
                <div className="my-10 rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
                  <div className="relative px-6 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/5" />
                    <div className="relative z-10 text-center md:text-left">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {t('blog.cta.title')}
                      </h3>
                      <p className="text-gray-400">
                        {t('blog.cta.description')}
                      </p>
                    </div>
                    <div className="relative z-10 flex-shrink-0">
                      <Button
                        asChild
                        size="lg"
                        className="rounded-full bg-orange-500 px-8 py-3 font-semibold text-gray-950 shadow-lg shadow-orange-500/20 hover:bg-orange-600"
                      >
                        <a
                          href={`https://dashboard.revillion.com/${safeLang}/registration`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('blog.cta.button')}
                          <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-8" aria-label={t('blog.pagination.label')}>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#blog-results"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) => Math.max(1, page - 1));
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          aria-label={t('blog.pagination.previous')}
                          aria-disabled={currentPage === 1}
                          tabIndex={currentPage === 1 ? -1 : undefined}
                        >
                          {t('blog.pagination.previous')}
                        </PaginationPrevious>
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#blog-results"
                            isActive={currentPage === page}
                            onClick={(event) => {
                              event.preventDefault();
                              setCurrentPage(page);
                            }}
                            className="cursor-pointer"
                            aria-label={t('blog.pagination.page', { page })}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#blog-results"
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage((page) => Math.min(totalPages, page + 1));
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          aria-label={t('blog.pagination.next')}
                          aria-disabled={currentPage === totalPages}
                          tabIndex={currentPage === totalPages ? -1 : undefined}
                        >
                          {t('blog.pagination.next')}
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
