import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Search, BookOpen } from 'lucide-react';
import { blogPosts, getBlogPostsByCategory } from '@/data/blogPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCategories } from '@/components/blog/BlogCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import revillionLogo from "@/assets/revillion-logo.png?format=webp&quality=85&w=170";

const Blog = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  useEffect(() => {
    let posts = getBlogPostsByCategory(activeCategory);
    
    if (searchQuery) {
      posts = posts.filter(post => 
        post.title[lang || 'en'].toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt[lang || 'en'].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPosts(posts);
  }, [activeCategory, searchQuery, lang]);

  const featuredPost = blogPosts[0];

  return (
    <>
      <Helmet>
        <title>{t('blog.title')} | Revillion Partners</title>
        <meta name="description" content={t('blog.subtitle')} />
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
                  to={`/${lang}`}
                  className="text-foreground hover:text-orange-500 transition-colors font-semibold"
                >
                  {t('nav.home')}
                </Link>
                <Button
                  onClick={() => navigate(`/${lang}`)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {t('hero.cta')}
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 rounded-full px-6 py-2 mb-6">
              <BookOpen className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-orange-400 font-medium">INSIGHTS & GUIDES</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              {t('blog.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              {t('blog.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('blog.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {!searchQuery && activeCategory === 'all' && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <BlogCard post={featuredPost} lang={lang || 'en'} featured />
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="py-8 bg-background sticky top-[73px] z-40 border-b border-border shadow-sm">
          <div className="container mx-auto px-4">
            <BlogCategories 
              activeCategory={activeCategory} 
              onCategoryChange={setActiveCategory} 
            />
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} lang={lang || 'en'} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">{t('blog.search.noResults')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('blog.newsletter.title')}
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              {t('blog.newsletter.description')}
            </p>
            <Button 
              onClick={() => navigate(`/${lang}`)}
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
            >
              {t('blog.newsletter.button')}
            </Button>
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

export default Blog;
