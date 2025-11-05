import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showScrollLinks?: boolean;
}

export const Layout = ({ children, showScrollLinks = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showScrollLinks={showScrollLinks} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
