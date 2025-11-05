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
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 flex gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,48%)] text-white border-0"
    >
      {t('blog.cta.button')}
      <ArrowRight className="h-5 w-5" />
    </Button>
  );
};
