import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Home, BarChart3, BookOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import { getDashboardUrl, getSiteLanguage } from '@/lib/dashboard';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const location = useLocation();
  const { lang } = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const baseLang = getSiteLanguage(lang || location.pathname.split('/')[1]);

  const links = [
    { href: `/${baseLang}`,            label: t('nav.home'),       icon: Home },
    { href: `/${baseLang}/blog`,       label: t('nav.blog'),       icon: BookOpen },
    { href: `/${baseLang}/calculator`, label: t('nav.calculator'), icon: BarChart3 },
    { href: `/${baseLang}/contact`,    label: t('nav.contact'),    icon: Mail },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Helmet>
        <html lang={baseLang} />
        <title>{t('notFound.metaTitle')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-24 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-xl mx-auto">
          {/* Big number */}
          <div className="text-[120px] sm:text-[180px] font-black leading-none tabular-nums text-white/5 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            404
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">{t('notFound.badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
              {t('notFound.title')} <span className="text-orange-500">{t('notFound.titleHighlight')}</span>
            </h1>

            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
              {t('notFound.description')}
            </p>

            <Button
              asChild
              className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-gray-950 font-bold py-4 px-8 text-base rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20"
            >
              <a
                href={getDashboardUrl(baseLang, 'registration')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('notFound.cta')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-200 rounded-full px-4 py-2 text-sm font-medium"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
