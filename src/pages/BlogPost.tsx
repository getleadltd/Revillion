import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { useBlogPost } from '@/hooks/useBlogPost';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { formatDate, calculateReadingTime, formatHTMLContent } from '@/lib/blog';
import { Layout } from '@/components/layout/Layout';
import { Loader2, Calendar, Clock } from 'lucide-react';

const BlogPost = () => {
  const { t } = useTranslation();
  const { lang = 'en', slug } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading, incrementViews } = useBlogPost(slug!, lang);

  // Track article view automatically
  useEffect(() => {
    if (post?.id) {
      incrementViews();
    }
  }, [post?.id, incrementViews]);

  // SEO-canonical redirect: ensure correct localized slug in URL
  useEffect(() => {
    if (post && slug) {
      const langSlugKey = `slug_${lang}` as keyof typeof post;
      const localizedSlug = (post[langSlugKey] as string | null) || post.slug || post.slug_en || slug;
      
      if (localizedSlug && slug !== localizedSlug) {
        navigate(`/${lang}/blog/${localizedSlug}`, { replace: true });
      }
    }
  }, [post, lang, slug, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t('blog.postNotFound')}</h1>
            <Link to={`/${lang}/blog`} className="text-primary hover:underline">
              {t('blog.backToBlog')}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const title = post[`title_${lang}` as keyof typeof post] as string || post.title_en;
  const content = post[`content_${lang}` as keyof typeof post] as string || post.content_en;
  const metaDesc = post[`meta_description_${lang}` as keyof typeof post] as string || post.meta_description_en;
  const formattedContent = formatHTMLContent(content);
  
  // Add language prefix to internal blog links
  const htmlWithLangLinks = formattedContent.replace(/href="\/blog\//g, `href="/${lang}/blog/`);
  
  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(htmlWithLangLinks, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'br', 'img', 'blockquote', 'code', 'pre', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });

  const currentUrl = `https://revillion-partners.com/${lang}/blog/${slug}`;

  // Structured Data - Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": metaDesc || title,
    "image": post.featured_image_url,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at || post.published_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": "Revillion Partners",
      "url": "https://revillion-partners.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Revillion Partners",
      "logo": {
        "@type": "ImageObject",
        "url": "https://revillion-partners.com/favicon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `https://revillion-partners.com/${lang}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t('blog.title'),
        "item": `https://revillion-partners.com/${lang}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": currentUrl
      }
    ]
  };

  return (
    <Layout>
      <Helmet>
        <title>{title} | Revillion Partners</title>
        <meta name="description" content={metaDesc || title} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc || title} />
        <meta property="og:url" content={currentUrl} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <meta property="article:published_time" content={post.published_at || post.created_at} />
        {post.updated_at && <meta property="article:modified_time" content={post.updated_at} />}
        <meta property="article:section" content={post.category} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
        
        {/* Hreflang tags for multilingual SEO */}
        {post.slug_en && (
          <link rel="alternate" hrefLang="en" href={`https://revillion-partners.com/en/blog/${post.slug_en}`} />
        )}
        {post.slug_de && (
          <link rel="alternate" hrefLang="de" href={`https://revillion-partners.com/de/blog/${post.slug_de}`} />
        )}
        {post.slug_it && (
          <link rel="alternate" hrefLang="it" href={`https://revillion-partners.com/it/blog/${post.slug_it}`} />
        )}
        {post.slug_pt && (
          <link rel="alternate" hrefLang="pt" href={`https://revillion-partners.com/pt/blog/${post.slug_pt}`} />
        )}
        {post.slug_es && (
          <link rel="alternate" hrefLang="es" href={`https://revillion-partners.com/es/blog/${post.slug_es}`} />
        )}
        <link rel="alternate" hrefLang="x-default" href={`https://revillion-partners.com/en/blog/${post.slug_en || slug}`} />
        
        {/* Structured Data - Article only (breadcrumbs are inline) */}
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <BlogCTA 
        postSlug={slug} 
        postTitle={title} 
        postCategory={post.category}
        postId={post.id}
      />

      <article className="bg-background">
        {/* Hero Image */}
        {post.featured_image_url && (
          <div className="w-full h-96 overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || title}
              title={title}
              loading="eager"
              fetchPriority="high"
              width={1200}
              height={630}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          {/* Breadcrumbs with Structured Data */}
          <Breadcrumbs
            items={[
              { name: 'Home', url: `https://revillion-partners.com/${lang}`, position: 1 },
              { name: t('blog.title'), url: `https://revillion-partners.com/${lang}/blog`, position: 2 }
            ]}
            currentPage={title}
            className="mb-6"
          />

          <div className="max-w-4xl mx-auto">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.published_at || post.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {calculateReadingTime(content)} {t('blog.readingTime')}
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {t(`blog.categories.${post.category}`)}
              </span>
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none dark:prose-invert 
                prose-headings:font-bold 
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:mb-6 prose-p:leading-relaxed prose-p:text-justify
                prose-strong:font-bold prose-strong:text-foreground
                prose-li:my-2
                prose-ul:my-6 prose-ol:my-6
                prose-a:text-primary prose-a:underline prose-a:font-semibold hover:prose-a:text-primary/80 hover:prose-a:decoration-2 transition-colors
                prose-img:rounded-lg prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Share Buttons */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">{t('blog.sharePost')}</h3>
              <ShareButtons title={title} url={window.location.href} />
            </div>

            {/* Related Posts */}
            <div className="mt-12">
              <RelatedPosts category={post.category} currentPostId={post.id} lang={lang} />
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
