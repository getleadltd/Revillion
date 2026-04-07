import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { SEOStatusWidget } from '@/components/admin/SEOStatusWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, FileEdit, Eye, Plus, List, Inbox, BarChart3 } from 'lucide-react';
import { useBlogPostsAdmin } from '@/hooks/useBlogPostsAdmin';
import { formatDate } from '@/lib/blog';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { lang = 'en' } = useParams();

  const { data: allData } = useBlogPostsAdmin({
    lang,
    statusFilter: 'all',
    page: 1,
    limit: 100,
  });

  const { data: publishedData } = useBlogPostsAdmin({
    lang,
    statusFilter: 'published',
    page: 1,
    limit: 5,
  });

  const allPosts = allData?.posts ?? [];
  const totalPosts = allData?.total || 0;
  const publishedCount = allPosts.filter((p) => p.status === 'published').length;
  const draftCount = allPosts.filter((p) => p.status === 'draft').length;
  const totalViews = allPosts.reduce((sum, p) => sum + (p.views || 0), 0);

  const latestPosts = publishedData?.posts?.slice(0, 5) ?? [];

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Panoramica del tuo blog
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Totale Articoli"
            value={totalPosts}
            icon={FileText}
            description="Tutti gli articoli del blog"
          />
          <StatsCard
            title="Pubblicati"
            value={publishedCount}
            icon={CheckCircle}
            description="Articoli visibili online"
          />
          <StatsCard
            title="Bozze"
            value={draftCount}
            icon={FileEdit}
            description="Articoli in lavorazione"
          />
          <StatsCard
            title="Visualizzazioni Totali"
            value={totalViews.toLocaleString()}
            icon={Eye}
            description="Conteggio visite"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white justify-start h-auto py-3">
            <Link to={`/${lang}/admin/blog/new`}>
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-sm">Nuovo Articolo</div>
                <div className="text-xs opacity-80">Crea manualmente</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3">
            <Link to={`/${lang}/admin/blog`}>
              <List className="h-4 w-4 mr-2 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-sm">Gestisci Articoli</div>
                <div className="text-xs text-muted-foreground">Tutti i contenuti</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3">
            <Link to={`/${lang}/admin/incoming`}>
              <Inbox className="h-4 w-4 mr-2 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-sm">Articoli in Arrivo</div>
                <div className="text-xs text-muted-foreground">Rivedi e approva</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start h-auto py-3">
            <Link to={`/${lang}/admin/analytics`}>
              <BarChart3 className="h-4 w-4 mr-2 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-sm">Analytics</div>
                <div className="text-xs text-muted-foreground">Performance articoli</div>
              </div>
            </Link>
          </Button>
        </div>

        {/* SEO Status Widget */}
        <SEOStatusWidget posts={allPosts || []} lang={lang} />

        {/* Latest Published Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Ultimi Articoli Pubblicati</CardTitle>
          </CardHeader>
          <CardContent>
            {latestPosts.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))] text-sm">
                Nessun articolo pubblicato ancora.
              </p>
            ) : (
              <div className="space-y-4">
                {latestPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <Link
                        to={`/${lang}/admin/blog/edit/${post.id}`}
                        className="font-medium hover:underline"
                      >
                        {post.title_en || post.title_it}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <Eye className="h-4 w-4" />
                      {post.views || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
    </>
  );
}
