import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const BlogCTA = () => {
  const { t } = useTranslation();

  const handleCTAClick = () => {
    // Scroll to homepage CTA section or navigate
    window.location.href = '/#cta';
  };

  return (
    <Button
      onClick={handleCTAClick}
      size="lg"
      className="fixed bottom-6 right-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 hidden md:flex gap-2"
    >
      {t('blog.cta.button')}
      <ArrowRight className="h-5 w-5" />
    </Button>
  );
};
