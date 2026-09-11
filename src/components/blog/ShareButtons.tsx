import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: t('blog.sharing.copySuccessTitle'),
        description: t('blog.sharing.copySuccessDescription'),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t('blog.sharing.copyErrorTitle'),
        description: t('blog.sharing.copyErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-2"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? t('blog.sharing.copied') : t('blog.sharing.copyLink')}
      </Button>

      {navigator.share && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          {t('blog.sharing.share')}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <a
          href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Twitter
        </a>
      </Button>

      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </Button>

      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <a
          href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </Button>
    </div>
  );
};
