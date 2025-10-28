import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Clock, Calendar, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getBlogPostBySlug, getRelatedPosts } from '@/data/blogPosts';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import revillionLogo from "@/assets/revillion-logo.png?format=webp&quality=85&w=170";
import NotFound from './NotFound';

const BlogPost = () => {
  const { lang, slug } = useParams<{ lang: string; slug: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const post = getBlogPostBySlug(slug || '');

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  useEffect(() => {
    if (post && slug && lang) {
      trackEvent('blog_post_view', {
        article_slug: slug,
        category: post.category,
        language: lang,
        reading_time: post.readingTime
      });
    }
  }, [post, slug, lang]);

  if (!post || !lang) {
    return <NotFound />;
  }

  const relatedPosts = getRelatedPosts(post.slug, post.category);
  const currentUrl = `https://revillion-partners.com/${lang}/blog/${slug}`;

  const handleCTAClick = (location: string) => {
    trackEvent('blog_cta_click', {
      cta_location: location,
      article_slug: slug,
      language: lang
    });
  };

  return (
    <>
      <Helmet>
        <title>{post.metaTitle[lang]}</title>
        <meta name="description" content={post.metaDescription[lang]} />
        <meta name="keywords" content={post.keywords[lang]} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.metaTitle[lang]} />
        <meta property="og:description" content={post.metaDescription[lang]} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.metaTitle[lang]} />
        <meta name="twitter:description" content={post.metaDescription[lang]} />

        {/* Schema.org Article */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title[lang],
            "description": post.excerpt[lang],
            "author": {
              "@type": "Person",
              "name": post.author.name
            },
            "publisher": {
              "@type": "Organization",
              "name": "Revillion Partners",
              "logo": {
                "@type": "ImageObject",
                "url": "https://revillion-partners.com/logo.png"
              }
            },
            "datePublished": post.publishedAt,
            "dateModified": post.publishedAt,
            "articleSection": post.category,
            "wordCount": post.content[lang].split(' ').length
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card shadow-lg sticky top-0 z-50 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link to={`/${lang}`}>
                <img 
                  src={revillionLogo} 
                  alt="Revillion Logo" 
                  width="170"
                  height="48"
                  className="h-12 w-auto"
                />
              </Link>
              <nav className="flex items-center gap-6">
                <Link 
                  to={`/${lang}/blog`}
                  className="text-foreground hover:text-orange-500 transition-colors font-semibold"
                >
                  {t('blog.title')}
                </Link>
                <a
                  href="https://dashboard.revillion.com/en/registration"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleCTAClick('header')}
                >
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    {t('hero.cta')}
                  </Button>
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to={`/${lang}`} className="hover:text-orange-500 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link to={`/${lang}/blog`} className="hover:text-orange-500 transition-colors">
                {t('blog.title')}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate">{post.title[lang]}</span>
            </div>
          </div>
        </div>

        {/* Article Header */}
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-8">
              <span className="inline-flex items-center bg-orange-500/10 text-orange-600 text-sm font-semibold px-4 py-2 rounded-full border border-orange-500/20 mb-6">
                {post.category.replace('-', ' ').toUpperCase()}
              </span>
              
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
                {post.title[lang]}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(post.publishedAt).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{post.readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold">{t('blog.author.by')} {post.author.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content with Sidebar */}
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[1fr_300px] gap-12 max-w-7xl mx-auto">
              {/* Main Content */}
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-3xl font-bold text-foreground mt-12 mb-6">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-2xl font-bold text-foreground mt-8 mb-4">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-foreground leading-relaxed mb-6">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-foreground">
                        {children}
                      </strong>
                    ),
                    a: ({ children, href }) => (
                      <a 
                        href={href}
                        className="text-orange-500 hover:text-orange-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 mb-6 text-foreground">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-2 mb-6 text-foreground">
                        {children}
                      </ol>
                    )
                  }}
                >
                  {post.content[lang]}
                </ReactMarkdown>

                {/* Inline CTA Box */}
                <div className="my-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
                  <h3 className="text-3xl font-bold mb-4">Ready to Start Earning?</h3>
                  <p className="text-white/90 mb-6 text-lg">
                    Join Revillion Partners today and start promoting 16+ premium casino brands with $50-$220 CPA rates.
                  </p>
                  <a
                    href="https://dashboard.revillion.com/en/registration"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCTAClick('inline')}
                  >
                    <Button 
                      size="lg"
                      className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
                    >
                      Become an Affiliate
                      <TrendingUp className="ml-2 w-5 h-5" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                <TableOfContents content={post.content[lang]} />
                <ShareButtons 
                  url={currentUrl}
                  title={post.title[lang]}
                  slug={post.slug}
                  lang={lang}
                />
              </aside>
            </div>

            {/* Author Box */}
            <div className="max-w-4xl mx-auto mt-12">
              <AuthorBox author={post.author} lang={lang} />
            </div>

            {/* Tags */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-foreground text-sm px-4 py-2 rounded-full border border-border"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Final CTA */}
            <div className="max-w-4xl mx-auto mt-12 bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Start Earning Today
              </h3>
              <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
                Join 800+ affiliates earning with Revillion Partners. No signup fees • 24/7 support • Start immediately
              </p>
              <a
                href="https://dashboard.revillion.com/en/registration"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick('end')}
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-bold"
                >
                  Join Revillion Partners
                  <TrendingUp className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        <RelatedPosts posts={relatedPosts} lang={lang} />

        {/* Back to Blog */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <Link to={`/${lang}/blog`}>
              <Button variant="outline" size="lg">
                <ArrowLeft className="mr-2 w-5 h-5" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2025 Revillion Partners. {t('footer.rights')}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BlogPost;
