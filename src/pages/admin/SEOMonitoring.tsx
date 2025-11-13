import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/admin/StatsCard';
import { 
  AlertTriangle, 
  Link2, 
  Image, 
  Globe, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface ErrorDetail {
  post_id: string;
  post_slug: string;
  post_title?: string;
  language?: string;
  url?: string;
  status_code?: number;
  error?: string;
  error_type: string;
  severity?: string;
  image_url?: string;
  image_src?: string;
  missing_languages?: string[];
  invalid_slugs?: Array<{ language: string; slug: string; issue: string }>;
}

interface SEOLog {
  id: string;
  scan_date: string;
  scan_type: string;
  total_items_checked: number;
  issues_found: number;
  error_details: ErrorDetail[];
  execution_time_ms: number;
  status: string;
}

function ErrorDetailCard({ error, scanType }: { error: ErrorDetail; scanType: string }) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-medium">{error.post_title || error.post_slug}</p>
          {error.language && (
            <Badge variant="outline" className="mt-1">
              {error.language.toUpperCase()}
            </Badge>
          )}
        </div>
        {error.severity && (
          <Badge variant="outline" className={getSeverityColor(error.severity)}>
            {error.severity}
          </Badge>
        )}
      </div>

      {scanType === 'broken_links' && (
        <p className="text-sm text-muted-foreground">
          Link: <code className="bg-muted px-1 rounded text-xs">{error.url}</code>
          {error.status_code && ` - Status: ${error.status_code}`}
          {error.error && ` - ${error.error}`}
        </p>
      )}

      {scanType === 'missing_alt_tags' && (
        <p className="text-sm text-muted-foreground">
          Immagine: <code className="bg-muted px-1 rounded text-xs">{error.image_url || error.image_src}</code>
        </p>
      )}

      {scanType === 'hreflang_errors' && (
        <div className="text-sm space-y-1">
          {error.missing_languages && error.missing_languages.length > 0 && (
            <p className="text-muted-foreground">
              Lingue mancanti: <strong>{error.missing_languages.join(', ').toUpperCase()}</strong>
            </p>
          )}
          {error.invalid_slugs && error.invalid_slugs.length > 0 && (
            <div>
              <p className="text-muted-foreground">Slug non validi:</p>
              {error.invalid_slugs.map((s, i) => (
                <p key={i} className="ml-4 text-xs">
                  {s.language.toUpperCase()}: <code className="bg-muted px-1 rounded">{s.slug}</code>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorsList({ logs }: { logs?: SEOLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="text-muted-foreground">Nessun problema rilevato</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map(log => (
        <Card key={log.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {log.scan_type.replace(/_/g, ' ').toUpperCase()}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(log.scan_date).toLocaleString('it-IT')} • {log.execution_time_ms}ms
                </p>
              </div>
              <Badge variant={log.issues_found > 0 ? 'destructive' : 'default'}>
                {log.issues_found} errori
              </Badge>
            </div>
          </CardHeader>
          {log.error_details && log.error_details.length > 0 && (
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {log.error_details.map((error, idx) => (
                  <ErrorDetailCard key={idx} error={error} scanType={log.scan_type} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function SEOMonitoring() {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['seo-monitoring-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_monitoring_logs')
        .select('*')
        .order('scan_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data?.map(log => ({
        ...log,
        error_details: (log.error_details as any) || []
      })) as SEOLog[];
    }
  });

  const triggerScan = useMutation({
    mutationFn: async () => {
      toast.info('Avvio scansione SEO...');
      const { data, error } = await supabase.functions.invoke('monitor-seo');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Scansione SEO completata con successo!');
      queryClient.invalidateQueries({ queryKey: ['seo-monitoring-logs'] });
    },
    onError: (error: any) => {
      toast.error(`Errore nella scansione: ${error.message}`);
    }
  });

  const getStats = () => {
    if (!logs) return null;
    
    const latest = logs.filter(log => {
      const logDate = new Date(log.scan_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return logDate >= yesterday;
    });

    return {
      brokenLinks: latest.find(l => l.scan_type === 'broken_links'),
      missingAlt: latest.find(l => l.scan_type === 'missing_alt_tags'),
      hreflang: latest.find(l => l.scan_type === 'hreflang_errors'),
      totalIssues: latest.reduce((sum, log) => sum + (log.issues_found || 0), 0)
    };
  };

  const stats = getStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">SEO Monitoring</h1>
            <p className="text-muted-foreground">
              Controlli automatici giornalieri alle 02:00 UTC
            </p>
          </div>
          <Button 
            onClick={() => triggerScan.mutate()}
            disabled={triggerScan.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${triggerScan.isPending ? 'animate-spin' : ''}`} />
            Scansiona Ora
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Broken Links"
            value={stats?.brokenLinks?.issues_found || 0}
            description={`su ${stats?.brokenLinks?.total_items_checked || 0} link`}
            icon={Link2}
          />
          <StatsCard
            title="Missing Alt Tags"
            value={stats?.missingAlt?.issues_found || 0}
            description={`su ${stats?.missingAlt?.total_items_checked || 0} immagini`}
            icon={Image}
          />
          <StatsCard
            title="Hreflang Errors"
            value={stats?.hreflang?.issues_found || 0}
            description={`su ${stats?.hreflang?.total_items_checked || 0} post`}
            icon={Globe}
          />
          <StatsCard
            title="Totale Problemi"
            value={stats?.totalIssues || 0}
            description="nelle ultime 24h"
            icon={AlertTriangle}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="broken_links">Broken Links</TabsTrigger>
            <TabsTrigger value="missing_alt_tags">Alt Tags</TabsTrigger>
            <TabsTrigger value="hreflang_errors">Hreflang</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ErrorsList logs={logs} />
          </TabsContent>

          <TabsContent value="broken_links">
            <ErrorsList logs={logs?.filter(l => l.scan_type === 'broken_links')} />
          </TabsContent>

          <TabsContent value="missing_alt_tags">
            <ErrorsList logs={logs?.filter(l => l.scan_type === 'missing_alt_tags')} />
          </TabsContent>

          <TabsContent value="hreflang_errors">
            <ErrorsList logs={logs?.filter(l => l.scan_type === 'hreflang_errors')} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
