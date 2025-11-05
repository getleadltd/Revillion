import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBlogAnalytics = () => {
  return useQuery({
    queryKey: ['blog-analytics'],
    queryFn: async () => {
      // Fetch all analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('blog_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Fetch blog posts data
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published');

      if (postsError) throw postsError;

      // Process data for dashboard
      const ctaClicks = analyticsData?.filter((a) => a.event_type === 'cta_click') || [];
      
      // Most viewed posts (by views field)
      const topPosts = [...(postsData || [])]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10);

      // CTA clicks by category
      const clicksByCategory = ctaClicks.reduce((acc, click) => {
        const category = click.post_category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // CTA clicks by post
      const clicksByPost = ctaClicks.reduce((acc, click) => {
        const slug = click.post_slug || 'unknown';
        const title = click.post_title || slug;
        if (!acc[slug]) {
          acc[slug] = { count: 0, title };
        }
        acc[slug].count++;
        return acc;
      }, {} as Record<string, { count: number; title: string }>);

      // Conversion rate by category (views vs CTA clicks)
      const conversionByCategory = Object.entries(clicksByCategory).map(([category, clicks]) => {
        const categoryPosts = postsData?.filter((p) => p.category === category) || [];
        const totalViews = categoryPosts.reduce((sum, p) => sum + (p.views || 0), 0);
        const conversionRate = totalViews > 0 ? ((clicks / totalViews) * 100).toFixed(2) : '0.00';
        
        return {
          category,
          clicks,
          views: totalViews,
          conversionRate: parseFloat(conversionRate),
        };
      }).sort((a, b) => b.conversionRate - a.conversionRate);

      // CTA clicks over time (last 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentClicks = ctaClicks.filter((click) => 
        new Date(click.created_at) >= last30Days
      );

      const clicksByDate = recentClicks.reduce((acc, click) => {
        const date = new Date(click.created_at).toLocaleDateString('it-IT');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const clicksTimeline = Object.entries(clicksByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        totalClicks: ctaClicks.length,
        totalViews: postsData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0,
        topPosts,
        clicksByCategory,
        clicksByPost,
        conversionByCategory,
        clicksTimeline,
        recentClicks: recentClicks.slice(0, 50),
      };
    },
  });
};
