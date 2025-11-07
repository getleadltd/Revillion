import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { calculateSEOStatus } from '@/hooks/useSEOStatus';
import { SEOScoreBadge } from './SEOScoreBadge';
import { SEOIssueChip } from './SEOIssueChip';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Edit } from 'lucide-react';

interface SEOStatusWidgetProps {
  posts: any[];
  lang: string;
}

export const SEOStatusWidget = ({ posts, lang }: SEOStatusWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate SEO status for all posts
  const postsWithSEO = posts.map(post => ({
    ...post,
    seoStatus: calculateSEOStatus(post),
  }));

  // Statistics
  const totalPosts = postsWithSEO.length;
  const perfectPosts = postsWithSEO.filter(p => p.seoStatus.seoScore === 100).length;
  const criticalPosts = postsWithSEO.filter(p => p.seoStatus.status === 'critical').length;

  // Posts with issues, sorted by score (worst first)
  const postsWithIssues = postsWithSEO
    .filter(p => p.seoStatus.totalIssues > 0)
    .sort((a, b) => a.seoStatus.seoScore - b.seoStatus.seoScore)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Stato SEO
        </CardTitle>
        <CardDescription>
          Monitora e correggi i problemi SEO dei tuoi articoli
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{totalPosts}</div>
            <div className="text-xs text-muted-foreground">Totale Post</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              {perfectPosts}
            </div>
            <div className="text-xs text-green-700 dark:text-green-400">SEO Perfetto</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {criticalPosts}
            </div>
            <div className="text-xs text-red-700 dark:text-red-400">Critici</div>
          </div>
        </div>

        {/* Collapsible list of posts with issues */}
        {postsWithIssues.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>{postsWithIssues.length} post con problemi SEO</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {postsWithIssues.map((post) => (
                <div
                  key={post.id}
                  className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/${lang}/admin/blog/edit/${post.id}`}
                          className="font-medium hover:underline truncate"
                        >
                          {post.title_en || post.title_it}
                        </Link>
                        <SEOScoreBadge
                          score={post.seoStatus.seoScore}
                          status={post.seoStatus.status}
                        />
                      </div>

                      {/* Issues */}
                      <div className="flex flex-wrap gap-2">
                        {post.seoStatus.missingSlugs.length > 0 && (
                          <SEOIssueChip type="slug" languages={post.seoStatus.missingSlugs} />
                        )}
                        {post.seoStatus.missingMetaDescriptions.length > 0 && (
                          <SEOIssueChip type="meta" languages={post.seoStatus.missingMetaDescriptions} />
                        )}
                        {post.seoStatus.missingImageAlt && (
                          <SEOIssueChip type="alt" />
                        )}
                      </div>
                    </div>

                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/${lang}/admin/blog/edit/${post.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Correggi
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {postsWithIssues.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="font-medium">Ottimo lavoro!</p>
            <p className="text-sm">Tutti i post hanno un SEO perfetto.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
