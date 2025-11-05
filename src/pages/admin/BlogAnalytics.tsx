import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBlogAnalytics } from '@/hooks/useBlogAnalytics';
import { Loader2, TrendingUp, MousePointerClick, Eye, BarChart3 } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['hsl(25, 95%, 53%)', 'hsl(211, 100%, 43%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)', 'hsl(280, 100%, 65%)'];

export default function BlogAnalytics() {
  const { data: analytics, isLoading } = useBlogAnalytics();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun dato analytics disponibile</p>
        </div>
      </AdminLayout>
    );
  }

  const overallConversionRate = analytics.totalViews > 0 
    ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(2)
    : '0.00';

  // Prepare data for charts
  const categoryChartData = Object.entries(analytics.clicksByCategory).map(([category, clicks]) => ({
    name: category,
    clicks,
  }));

  const topClickedPosts = Object.entries(analytics.clicksByPost)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([slug, data]) => ({
      name: data.title.length > 30 ? data.title.substring(0, 30) + '...' : data.title,
      clicks: data.count,
    }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Blog</h1>
          <p className="text-muted-foreground">
            Metriche dettagliate e conversioni CTA
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Click CTA Totali"
            value={analytics.totalClicks.toLocaleString()}
            icon={MousePointerClick}
            description="Tutti i click sul CTA blog"
          />
          <StatsCard
            title="Visualizzazioni Totali"
            value={analytics.totalViews.toLocaleString()}
            icon={Eye}
            description="Views articoli pubblicati"
          />
          <StatsCard
            title="Tasso Conversione"
            value={`${overallConversionRate}%`}
            icon={TrendingUp}
            description="Click / Views totali"
          />
          <StatsCard
            title="Articoli Tracciati"
            value={analytics.topPosts.length}
            icon={BarChart3}
            description="Articoli con analytics"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* CTA Clicks by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Click CTA per Categoria</CardTitle>
              <CardDescription>Distribuzione click per categoria articolo</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="clicks"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Tasso Conversione per Categoria</CardTitle>
              <CardDescription>Click vs Views per categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.conversionByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.conversionByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                    />
                    <Bar dataKey="conversionRate" fill="hsl(25, 95%, 53%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Clicked Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Articoli con Più Click CTA</CardTitle>
              <CardDescription>Top 10 articoli per conversioni</CardDescription>
            </CardHeader>
            <CardContent>
              {topClickedPosts.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topClickedPosts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="hsl(211, 100%, 43%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Viewed Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Articoli Più Visti</CardTitle>
              <CardDescription>Top 10 per visualizzazioni</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topPosts.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topPosts.map((post, index) => {
                    const title = post.title_en || post.title_it || 'Untitled';
                    const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
                    return (
                      <div key={post.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="font-bold text-2xl text-muted-foreground">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{displayTitle}</p>
                            <p className="text-sm text-muted-foreground">{post.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{post.views?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA Clicks Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Andamento Click CTA (Ultimi 30 Giorni)</CardTitle>
            <CardDescription>Trend temporale dei click sul CTA blog</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.clicksTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.clicksTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(25, 95%, 53%)" 
                    strokeWidth={2}
                    name="Click CTA"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun dato negli ultimi 30 giorni
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventi Recenti</CardTitle>
            <CardDescription>Ultimi 50 eventi tracciati</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentClicks.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {analytics.recentClicks.map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {event.post_title || event.post_slug || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.post_category} • {new Date(event.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nessun evento recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
