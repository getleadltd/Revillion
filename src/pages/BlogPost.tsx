import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { useBlogPost } from '@/hooks/useBlogPost';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { formatDate, calculateReadingTime, formatHTMLContent } from '@/lib/blog';
import { Layout } from '@/components/layout/Layout';
import { Loader2, Calendar, Clock } from 'lucide-react';

const BlogPost = () => {
  const { t } = useTranslation();
  const { lang = 'en', slug } = useParams();
  const { data: post, isLoading, incrementViews } = useBlogPost(slug!, lang);


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
  
  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(formattedContent, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'br', 'img', 'blockquote', 'code', 'pre', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });

  return (
    <Layout>
      <Helmet>
        <title>{title} | Revillion Partners</title>
        <meta name="description" content={metaDesc || title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc || title} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
      </Helmet>

      <BlogCTA />

      <article className="bg-background">
        {/* Hero Image */}
        {post.featured_image_url && (
          <div className="w-full h-96 overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || title}
              title={title}
              loading="eager"
              width={1200}
              height={630}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="container mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link to={`/${lang}`} className="hover:text-primary">Home</Link>
            {' > '}
            <Link to={`/${lang}/blog`} className="hover:text-primary">{t('blog.title')}</Link>
            {' > '}
            <span className="text-foreground">{title}</span>
          </nav>

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
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
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
