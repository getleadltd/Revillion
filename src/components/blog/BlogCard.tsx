import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const slug = post[`slug_${lang}` as keyof BlogPost] as string || post.slug_en || post.slug;

  return (
    <Card className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      {post.featured_image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.featured_image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      
      <CardHeader>
        <Badge className="w-fit mb-2" variant="secondary">
          {t(`blog.categories.${post.category}`) || post.category}
        </Badge>
        <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-3">
          {excerpt}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.published_at || post.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {calculateReadingTime(post.content_en)} min
          </div>
        </div>
        
        <Button asChild variant="default" className="w-full">
          <Link to={`/${lang}/blog/${slug}`}>
            {t('blog.readMore')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
