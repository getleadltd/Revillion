import { Badge } from '@/components/ui/badge';
import { Link2, FileText, Image } from 'lucide-react';

interface SEOIssueChipProps {
  type: 'slug' | 'meta' | 'alt';
  languages?: string[];
}

export const SEOIssueChip = ({ type, languages }: SEOIssueChipProps) => {
  const getConfig = () => {
    switch (type) {
      case 'slug':
        return {
          icon: Link2,
          label: `Slug: ${languages?.join(', ').toUpperCase()}`,
          className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        };
      case 'meta':
        return {
          icon: FileText,
          label: `Meta: ${languages?.join(', ').toUpperCase()}`,
          className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        };
      case 'alt':
        return {
          icon: Image,
          label: 'Alt Text',
          className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
