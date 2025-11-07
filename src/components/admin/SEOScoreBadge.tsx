import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SEOStatus } from '@/hooks/useSEOStatus';

interface SEOScoreBadgeProps {
  score: number;
  status: SEOStatus['status'];
}

export const SEOScoreBadge = ({ score, status }: SEOScoreBadgeProps) => {
  const getVariantClass = () => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20';
      case 'good':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20';
      case 'needs-work':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'excellent':
        return 'Eccellente';
      case 'good':
        return 'Buono';
      case 'needs-work':
        return 'Da Migliorare';
      case 'critical':
        return 'Critico';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={getVariantClass()}>
            {score}/100
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{getStatusLabel()}</p>
          <p className="text-xs text-muted-foreground">Punteggio SEO: {score}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
