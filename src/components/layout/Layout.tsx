import { Header } from './Header';
import { Footer } from './Footer';
import { StickyCtaMobile } from '@/components/StickyCtaMobile';
import { useDynamicLang } from '@/hooks/useDynamicLang';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
  showScrollLinks?: boolean;
}

export const Layout = ({ children, showScrollLinks = false }: LayoutProps) => {
  useDynamicLang();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-gray-950 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {t('accessibility.skipToContent')}
      </a>
      <Header showScrollLinks={showScrollLinks} />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <StickyCtaMobile />
    </div>
  );
};
