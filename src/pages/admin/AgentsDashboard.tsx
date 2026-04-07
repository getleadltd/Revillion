import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Bot, CheckCircle2, XCircle, Clock, ChevronDown, RefreshCw, Zap, BarChart3, Globe, Image, FileText, Target, Star } from 'lucide-react';
import { formatDate } from '@/lib/blog';

// ─── Agent icon map ───────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ReactNode> = {
  seo:          <BarChart3 className="w-4 h-4" />,
  readability:  <FileText className="w-4 h-4" />,
  structure:    <FileText className="w-4 h-4" />,
  cta:          <Target className="w-4 h-4" />,
  multilingual: <Globe className="w-4 h-4" />,
  eeat:         <Star className="w-4 h-4" />,
  image:        <Image className="w-4 h-4" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-500 border-green-500/30 bg-green-500/10'
    : score >= 65 ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
    : score >= 50 ? 'text-orange-500 border-orange-500/30 bg-orange-500/10'
    : 'text-red-500 border-red-500/30 bg-red-500/10';
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${color}`}>
      {grade} · {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Completato</Badge>;
  if (status === 'running')   return <Badge variant="outline" className="text-orange-500 border-orange-500/30 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> In esecuzione</Badge>;
  if (status === 'failed')    return <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1"><XCircle className="w-3 h-3" /> Fallito</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> In attesa</Badge>;
}

function TaskTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    article_review: 'Review Articolo',
    content_generation: 'Generazione Contenuto',
    production_check: 'Verifica Produzione',
  };
  return <span className="text-xs text-muted-foreground">{map[type] ?? type}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentsDashboard() {
  const [openTask, setOpenTask] = useState<string | null>(null);

  const { data: tasks, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['agent-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5000, // auto-refresh every 5s while tasks running
  });

  const runningCount = tasks?.filter(t => t.status === 'running').length ?? 0;
  const completedCount = tasks?.filter(t => t.status === 'completed').length ?? 0;
  const avgScore = tasks?.filter(t => t.score).reduce((sum, t, _, arr) => sum + t.score / arr.length, 0) ?? 0;

  return (
    <>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <AdminLayout>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Bot className="w-8 h-8 text-orange-500" />
                Agent Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitora e controlla tutti i task degli agenti AI
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -translate-y-4 translate-x-4" />
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{tasks?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Task totali</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full -translate-y-4 translate-x-4" />
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Completati</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -translate-y-4 translate-x-4" />
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-500">{avgScore > 0 ? Math.round(avgScore) : '—'}</div>
                <p className="text-xs text-muted-foreground mt-1">Score medio</p>
              </CardContent>
            </Card>
          </div>

          {/* Running tasks alert */}
          {runningCount > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-orange-500 animate-spin shrink-0" />
              <p className="text-sm text-orange-400 font-medium">
                {runningCount} agente{runningCount > 1 ? 'i' : ''} in esecuzione — la pagina si aggiorna automaticamente ogni 5 secondi
              </p>
            </div>
          )}

          {/* Task list */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : tasks?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40 text-center gap-3">
                <Bot className="w-10 h-10 text-muted-foreground/30" />
                <div>
                  <p className="font-medium">Nessun task ancora</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Avvia una review articolo dalla pagina degli articoli per vedere i risultati qui.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks?.map((task: any) => (
                <Collapsible
                  key={task.id}
                  open={openTask === task.id}
                  onOpenChange={(open) => setOpenTask(open ? task.id : null)}
                >
                  <Card className={task.status === 'running' ? 'border-orange-500/30' : ''}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <StatusBadge status={task.status} />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {task.summary?.post_title || task.input?.title || 'Task ' + task.id.slice(0, 8)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <TaskTypeLabel type={task.type} />
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground">{formatDate(task.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            {task.score != null && <ScoreBadge score={task.score} />}
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openTask === task.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-6">

                        {/* Summary */}
                        {task.summary && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {task.summary.top_issues?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Problemi</p>
                                <ul className="space-y-1">
                                  {task.summary.top_issues.map((issue: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {task.summary.top_suggestions?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Suggerimenti</p>
                                <ul className="space-y-1">
                                  {task.summary.top_suggestions.map((s: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                      <Zap className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {task.summary.passed?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Punti di forza</p>
                                <ul className="space-y-1">
                                  {task.summary.passed.map((p: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                                      {p}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Per-agent results */}
                        {task.agents && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Risultati per agente</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {task.agents.map((agent: any) => (
                                <div key={agent.id} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                      <span className="text-orange-500">{AGENT_ICONS[agent.id] ?? <Bot className="w-4 h-4" />}</span>
                                      {agent.name}
                                    </div>
                                    {agent.score != null && <ScoreBadge score={agent.score} />}
                                  </div>
                                  {agent.result?.issues?.slice(0, 2).map((issue: string, i: number) => (
                                    <p key={i} className="text-xs text-muted-foreground mt-1 flex gap-1">
                                      <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                      {issue}
                                    </p>
                                  ))}
                                  {agent.error && (
                                    <p className="text-xs text-red-400 mt-1">Errore: {agent.error}</p>
                                  )}
                                  {agent.duration_ms && (
                                    <p className="text-xs text-muted-foreground/50 mt-2">{(agent.duration_ms / 1000).toFixed(1)}s</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
