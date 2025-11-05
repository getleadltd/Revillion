import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';

interface BlogCTAProps {
  postSlug?: string;
  postTitle?: string;
  postCategory?: string;
  postId?: string;
}

export const BlogCTA = ({ postSlug, postTitle, postCategory, postId }: BlogCTAProps) => {
  const { t } = useTranslation();

  const handleCTAClick = async () => {
    // Track evento GA4
    trackEvent('blog_cta_click', {
      event_category: 'blog_engagement',
      event_label: postSlug || 'unknown',
      post_title: postTitle,
      post_category: postCategory,
      cta_location: 'sticky_button',
      value: 1
    });
    
    // Track evento nel database per analytics dashboard
    try {
      await supabase.from('blog_analytics').insert({
        event_type: 'cta_click',
        post_id: postId || null,
        post_slug: postSlug || null,
        post_title: postTitle || null,
        post_category: postCategory || null,
        event_data: { cta_location: 'sticky_button' },
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });
    } catch (error) {
      console.error('Error tracking CTA click:', error);
    }
    
    // Costruire URL con parametri UTM
    const utmParams = new URLSearchParams({
      utm_source: 'blog',
      utm_medium: 'cta_button',
      utm_campaign: 'blog_conversion',
      utm_content: postSlug || 'unknown'
    });
    
    window.location.href = `/#cta?${utmParams.toString()}`;
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
