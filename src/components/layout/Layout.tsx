import { Header } from './Header';
import { Footer } from './Footer';
import { StickyCtaMobile } from '@/components/StickyCtaMobile';
import { useDynamicLang } from '@/hooks/useDynamicLang';

interface LayoutProps {
  children: React.ReactNode;
  showScrollLinks?: boolean;
}

export const Layout = ({ children, showScrollLinks = false }: LayoutProps) => {
  useDynamicLang();
  return (
    <div className="min-h-screen flex flex-col">
      <Header showScrollLinks={showScrollLinks} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <StickyCtaMobile />
    </div>
  );
};
