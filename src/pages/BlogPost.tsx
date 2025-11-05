import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useBlogPost } from '@/hooks/useBlogPost';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { formatDate, calculateReadingTime } from '@/lib/blog';
import { Loader2, Calendar, Clock, Eye } from 'lucide-react';

const BlogPost = () => {
  const { t } = useTranslation();
  const { lang = 'en', slug } = useParams();
  const { data: post, isLoading, incrementViews } = useBlogPost(slug!, lang);

  useEffect(() => {
    if (post) {
      incrementViews();
    }
  }, [post, incrementViews]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('blog.postNotFound')}</h1>
          <Link to={`/${lang}/blog`} className="text-primary hover:underline">
            {t('blog.backToBlog')}
          </Link>
        </div>
      </div>
    );
  }

  const title = post[`title_${lang}` as keyof typeof post] as string || post.title_en;
  const content = post[`content_${lang}` as keyof typeof post] as string || post.content_en;
  const metaDesc = post[`meta_description_${lang}` as keyof typeof post] as string || post.meta_description_en;

  return (
    <>
      <Helmet>
        <title>{title} | Revillion Partners</title>
        <meta name="description" content={metaDesc || title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc || title} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
      </Helmet>

      <article className="min-h-screen bg-background">
        {/* Hero Image */}
        {post.featured_image_url && (
          <div className="w-full h-96 overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={title}
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
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {post.views} {t('blog.views')}
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                {t(`blog.categories.${post.category}`)}
              </span>
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: content }}
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
    </>
  );
};

export default BlogPost;
