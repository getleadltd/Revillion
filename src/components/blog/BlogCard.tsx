import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, BookOpen, Newspaper, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, calculateReadingTime } from '@/lib/blog';

interface BlogPost {
  id: string;
  slug: string;
  slug_en?: string;
  slug_de?: string;
  slug_it?: string;
  slug_pt?: string;
  slug_es?: string;
  title_en: string;
  title_de?: string;
  title_it?: string;
  title_pt?: string;
  title_es?: string;
  excerpt_en?: string;
  excerpt_de?: string;
  excerpt_it?: string;
  excerpt_pt?: string;
  excerpt_es?: string;
  content_en: string;
  featured_image_url?: string;
  category: string;
  published_at: string;
  created_at: string;
}

interface BlogCardProps {
  post: BlogPost;
  lang: string;
}

export const BlogCard = ({ post, lang }: BlogCardProps) => {
  const { t } = useTranslation();
  
  const title = post[`title_${lang}` as keyof BlogPost] as string || post.title_en;
  const excerpt = post[`excerpt_${lang}` as keyof BlogPost] as string || post.excerpt_en || '';
  
  // Priorità: 1) slug della lingua corrente, 2) slug legacy, 3) slug_en come fallback
  const langSlugKey = `slug_${lang}` as keyof BlogPost;
  const langSlug = post[langSlugKey] as string | undefined | null;
  const slug = langSlug || post.slug || post.slug_en || '';

  const categoryConfig: Record<string, { icon: typeof BookOpen; gradient: string }> = {
    guides: { icon: BookOpen, gradient: 'from-blue-600 to-indigo-700' },
    news: { icon: Newspaper, gradient: 'from-orange-500 to-red-600' },
    'casino-reviews': { icon: Star, gradient: 'from-emerald-500 to-teal-700' },
  };
  const { icon: FallbackIcon, gradient } = categoryConfig[post.category] || categoryConfig.news;

  return (
    <Card className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-orange-200">
      {/* Image or gradient fallback */}
      <div className="aspect-video overflow-hidden relative">
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={`${t(`blog.categories.${post.category}`)} - ${title}`}
            width={400}
            height={225}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <FallbackIcon className="w-12 h-12 text-white/40" />
          </div>
        )}
        {/* Category badge overlay */}
        <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 backdrop-blur-sm border-0 shadow-sm font-semibold text-xs">
          {t(`blog.categories.${post.category}`) || post.category}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <h3 className="text-lg font-bold line-clamp-2 group-hover:text-orange-600 transition-colors duration-200 leading-snug">
          {title}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {excerpt}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.published_at || post.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {calculateReadingTime(post.content_en)} min
          </span>
        </div>

        <Link
          to={`/${lang}/blog/${slug}`}
          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold text-sm group-hover:gap-2 transition-all duration-200"
        >
          {t('blog.readMore')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
};
