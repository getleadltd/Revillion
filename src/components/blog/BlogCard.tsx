import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { BlogPost } from '@/data/blogPosts';

interface BlogCardProps {
  post: BlogPost;
  lang: string;
  featured?: boolean;
}

export const BlogCard = ({ post, lang, featured = false }: BlogCardProps) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'affiliate-tips': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'industry-news': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'success-stories': 'bg-green-500/10 text-green-600 border-green-500/20',
      'tools': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'seo': 'bg-pink-500/10 text-pink-600 border-pink-500/20'
    };
    return colors[category] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  if (featured) {
    return (
      <Link to={`/${lang}/blog/${post.slug}`}>
        <div className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-border">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative h-64 md:h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-20" />
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Featured
                </span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <span className={`inline-flex items-center w-fit text-xs font-semibold px-3 py-1 rounded-full border mb-4 ${getCategoryColor(post.category)}`}>
                {post.category.replace('-', ' ').toUpperCase()}
              </span>
              <h3 className="text-3xl font-bold text-foreground mb-4 group-hover:text-orange-500 transition-colors line-clamp-2">
                {post.title[lang]}
              </h3>
              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                {post.excerpt[lang]}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{post.readingTime} min read</span>
                </div>
                <div className="flex items-center text-orange-500 font-semibold group-hover:translate-x-2 transition-transform">
                  Read Article
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/${lang}/blog/${post.slug}`}>
      <div className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-border h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/20 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${getCategoryColor(post.category)}`}>
              {post.category.replace('-', ' ').toUpperCase()}
            </span>
          </div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-orange-500 transition-colors line-clamp-2">
            {post.title[lang]}
          </h3>
          <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
            {post.excerpt[lang]}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span>{post.readingTime} min</span>
            </div>
            <div className="flex items-center text-orange-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Read More
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
