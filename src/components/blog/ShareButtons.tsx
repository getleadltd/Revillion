import { useState } from 'react';
import { Twitter, Linkedin, Facebook, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/lib/analytics';

interface ShareButtonsProps {
  url: string;
  title: string;
  slug: string;
  lang: string;
}

export const ShareButtons = ({ url, title, slug, lang }: ShareButtonsProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: string, shareUrl: string) => {
    trackEvent('blog_share', {
      platform,
      article_slug: slug,
      language: lang
    });
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    trackEvent('blog_share', {
      platform: 'copy_link',
      article_slug: slug,
      language: lang
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareButtons = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: 'hover:bg-blue-400 hover:text-white'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'hover:bg-blue-600 hover:text-white'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'hover:bg-blue-500 hover:text-white'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      color: 'hover:bg-green-500 hover:text-white'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-md">
      <h3 className="font-bold text-foreground mb-4">{t('blog.share.title')}</h3>
      <div className="flex flex-wrap gap-3">
        {shareButtons.map((button) => (
          <button
            key={button.name}
            onClick={() => handleShare(button.name.toLowerCase(), button.url)}
            className={`p-3 rounded-full bg-muted transition-all duration-300 ${button.color}`}
            aria-label={`Share on ${button.name}`}
          >
            <button.icon className="w-5 h-5" />
          </button>
        ))}
        <button
          onClick={copyToClipboard}
          className={`p-3 rounded-full transition-all duration-300 ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-muted hover:bg-orange-500 hover:text-white'
          }`}
          aria-label="Copy link"
        >
          {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
        </button>
      </div>
      {copied && (
        <p className="text-sm text-green-600 mt-3 font-medium">{t('blog.share.copied')}</p>
      )}
    </div>
  );
};
