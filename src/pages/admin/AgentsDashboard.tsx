import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2, Bot, CheckCircle2, XCircle, Clock, ChevronDown, RefreshCw,
  Zap, BarChart3, Globe, Image, FileText, Target, Star, Play, ListOrdered,
  Cpu, Database, Sparkles, Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/blog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry { ts: string; step: string; msg: string; [key: string]: any; }

// ─── Agent icon map ───────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ReactNode> = {
  seo: <BarChart3 className="w-4 h-4" />, readability: <FileText className="w-4 h-4" />,
  structure: <FileText className="w-4 h-4" />, cta: <Target className="w-4 h-4" />,
  multilingual: <Globe className="w-4 h-4" />, eeat: <Star className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
};

// ─── Pipeline steps for live animation ───────────────────────────────────────

const PIPELINE = [
  { id: 'analyze',   icon: BarChart3,  label: 'Analisi',     done: ['analyze_done'] },
  { id: 'generate',  icon: Sparkles,   label: 'Scrittura',   done: ['content_done'] },
  { id: 'image',     icon: Image,      label: 'Immagine',    done: ['image_done'] },
  { id: 'translate', icon: Globe,      label: 'Traduzione',  done: ['translate_done'] },
  { id: 'save',      icon: Database,   label: 'Salvataggio', done: ['saved'] },
  { id: 'review',    icon: Bot,        label: '7 Agenti',    done: ['review_done'] },
  { id: 'publish',   icon: CheckCircle2, label: 'Pubblica',  done: ['published', 'not_published'] },
];

const STEP_ACTIVE: Record<string, string[]> = {
  analyze: ['analyze'], generate: ['generate_start'], image: ['generate_start'],
  translate: ['translate_start'], save: ['save'], review: ['review_start'], publish: ['review_done'],
};

function getPipelineStatus(logs: LogEntry[], stepId: string): 'done' | 'active' | 'idle' {
  const s = PIPELINE.find(p => p.id === stepId)!;
  if (logs.some(l => s.done.includes(l.step))) return 'done';
  if (logs.some(l => STEP_ACTIVE[stepId]?.includes(l.step))) return 'active';
  return 'idle';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-500 border-green-500/30 bg-green-500/10'
    : score >= 65 ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
    : score >= 50 ? 'text-orange-500 border-orange-500/30 bg-orange-500/10'
    : 'text-red-500 border-red-500/30 bg-red-500/10';
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${color}`}>{grade} · {score}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Completato</Badge>;
  if (status === 'running')   return <Badge variant="outline" className="text-orange-500 border-orange-500/30 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> In esecuzione</Badge>;
  if (status === 'failed')    return <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1"><XCircle className="w-3 h-3" /> Fallito</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> In attesa</Badge>;
}

function TaskTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = { article_review: 'Review', content_generation: 'Generazione', production_check: 'Verifica' };
  return <span className="text-xs text-muted-foreground">{map[type] ?? type}</span>;
}

function QueueStatusBadge({ status }: { status: string }) {
  if (status === 'processing') return <Badge variant="outline" className="text-orange-500 border-orange-500/30 gap-1 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> In corso</Badge>;
  if (status === 'completed')  return <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Fatto</Badge>;
  return <Badge variant="outline" className="gap-1 text-xs"><Clock className="w-3 h-3" /> In coda</Badge>;
}

// ─── Live Agent Animation ─────────────────────────────────────────────────────

function LiveAgentPanel({ task }: { task: any }) {
  const logs: LogEntry[] = Array.isArray(task?.agents) ? task.agents : [];
  const lastLog = logs[logs.length - 1];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent p-6 mb-6">
      {/* Animated glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-500/10 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-orange-500/5 blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-orange-500" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-400">Agenti in esecuzione</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs">{task.input?.title ?? 'Generazione articolo...'}</p>
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="grid grid-cols-7 gap-2 mb-5">
        {PIPELINE.map((step) => {
          const status = getPipelineStatus(logs, step.id);
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                status === 'done'   ? 'bg-green-500/20 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]' :
                status === 'active' ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.5)] scale-110' :
                'bg-muted/40 text-muted-foreground/40'
              }`}>
                {status === 'active'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : status === 'done'
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${
                status === 'done' ? 'text-green-400' :
                status === 'active' ? 'text-orange-400' : 'text-muted-foreground/40'
              }`}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Last log message */}
      {lastLog && (
        <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5">
          <Zap className="w-4 h-4 text-orange-400 shrink-0 animate-pulse mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-orange-300 font-medium leading-snug">{lastLog.msg}</p>
            <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">
              {new Date(lastLog.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentsDashboard() {
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [runningItemId, setRunningItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['agent-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 3000,
    retry: 1,
  });

  const { data: queueItems } = useQuery({
    queryKey: ['blog-queue-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_queue').select('*')
        .in('status', ['pending', 'processing'])
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 3000,
  });

  const runningTasks   = tasks?.filter(t => t.status === 'running') ?? [];
  const completedCount = tasks?.filter(t => t.status === 'completed').length ?? 0;
  const scored = tasks?.filter(t => t.score != null) ?? [];
  const avgScore = scored.length ? Math.round(scored.reduce((sum, t) => sum + (t.score ?? 0), 0) / scored.length) : 0;

  const handleResetFailed = async () => {
    const { error } = await supabase
      .from('blog_queue')
      .update({ status: 'pending' })
      .eq('status', 'failed');
    if (!error) {
      toast({ title: '♻️ Articoli ripristinati', description: 'Gli articoli falliti sono stati rimessi in coda.' });
      queryClient.invalidateQueries({ queryKey: ['blog-queue-dashboard'] });
    }
  };

  const handleResetAll = async () => {
    try {
      // 1. Delete all agent_tasks
      await supabase.from('agent_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // 2. Reset all blog_queue entries to pending and clear generated_post_id
      await supabase.from('blog_queue')
        .update({ status: 'pending', generated_post_id: null, processed_at: null })
        .in('status', ['completed', 'failed', 'processing']);
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['blog-queue-dashboard'] });
      toast({ title: '🔄 Reset completato', description: 'Tutti i task eliminati e gli articoli rimessi in coda.' });
    } catch (err: any) {
      toast({ title: 'Errore reset', description: err?.message, variant: 'destructive' });
    }
  };

  const handleRunItem = async (itemId: string, title: string) => {
    setRunningItemId(itemId);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autopilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ force: true, queue_item_id: itemId }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        toast({ title: `Errore ${res.status}`, description: text.slice(0, 200), variant: 'destructive' });
        return;
      }

      const json = await res.json();
      if (json.error) {
        toast({ title: 'Errore', description: json.error, variant: 'destructive' });
      } else if (json.skipped) {
        if (json.reason === 'autopilot_disabled') {
          toast({ title: 'Funzione da aggiornare', description: 'Rideploya "autopilot" su Lovable per abilitare il pulsante Esegui.', variant: 'destructive' });
        } else if (json.reason === 'queue_empty') {
          toast({ title: 'Coda vuota', description: 'Nessun articolo pending trovato.' });
        } else {
          toast({ title: 'Saltato', description: json.reason });
        }
      } else {
        toast({ title: '🤖 Agenti avviati!', description: `Generazione di "${title}" in corso — segui qui sotto.` });
        queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['blog-queue-dashboard'] });
      }
    } catch (err: any) {
      toast({ title: 'Funzione non raggiungibile', description: err?.message, variant: 'destructive' });
    } finally {
      setRunningItemId(null);
    }
  };

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
              <p className="text-muted-foreground mt-1">Monitora e controlla tutti i task degli agenti AI</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetFailed} className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10">
                <RefreshCw className="w-4 h-4" />
                Riprova falliti
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                    Resetta tutto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resetta tutto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione eliminerà tutti i task dalla dashboard e rimetterà in coda tutti gli articoli (completati, falliti, in corso). I post già generati nel blog NON verranno eliminati.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Resetta tutto
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>

          {/* ── Live agent animation (shown when tasks are running) ─────────── */}
          {runningTasks.map(task => <LiveAgentPanel key={task.id} task={task} />)}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Task totali',  value: tasks?.length ?? 0,                  color: 'orange' },
              { label: 'Completati',   value: completedCount,                       color: 'green'  },
              { label: 'Score medio',  value: avgScore > 0 ? avgScore : '—',        color: 'orange' },
            ].map(s => (
              <Card key={s.label} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-16 h-16 bg-${s.color}-500/5 rounded-full -translate-y-4 translate-x-4`} />
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${s.color === 'green' ? 'text-green-500' : s.label === 'Score medio' ? 'text-orange-500' : ''}`}>{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              <p className="font-semibold mb-1">Errore caricamento task</p>
              <p className="text-xs opacity-80">{(error as Error).message}</p>
              <p className="text-xs mt-2 opacity-60">Verifica che la tabella <code>agent_tasks</code> esista nel tuo Supabase.</p>
            </div>
          )}

          {/* ── Articoli in coda ──────────────────────────────────────────────── */}
          {(queueItems?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-orange-500" />
                  Articoli in coda — clicca Esegui per generare subito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {queueItems!.map((item: any) => {
                  const isPending = item.status === 'pending';
                  const isProcessing = item.status === 'processing';
                  const isRunningThis = runningItemId === item.id;
                  return (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isProcessing ? 'bg-orange-500/5 border-orange-500/20' : 'border-border hover:bg-muted/30'}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.priority >= 8 ? 'bg-red-400' : item.priority >= 5 ? 'bg-orange-400' : 'bg-muted-foreground/40'}`} />
                      <p className="flex-1 text-sm font-medium truncate">{item.title}</p>
                      {item.category && <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">{item.category}</Badge>}
                      <QueueStatusBadge status={item.status} />
                      <Button
                        size="sm"
                        disabled={!isPending || isRunningThis}
                        onClick={() => handleRunItem(item.id, item.title)}
                        className={`gap-1.5 shrink-0 ${isPending ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'opacity-50'}`}
                        variant={isPending ? 'default' : 'outline'}
                      >
                        {isRunningThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        {isRunningThis ? 'Avvio...' : isProcessing ? 'In corso' : 'Esegui'}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── Task history ──────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
          ) : tasks?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40 text-center gap-3">
                <Bot className="w-10 h-10 text-muted-foreground/30" />
                <div>
                  <p className="font-medium">Nessun task ancora</p>
                  <p className="text-sm text-muted-foreground mt-1">Esegui un articolo dalla coda qui sopra.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks?.map((task: any) => (
                <Collapsible key={task.id} open={openTask === task.id} onOpenChange={(open) => setOpenTask(open ? task.id : null)}>
                  <Card className={task.status === 'running' ? 'border-orange-500/30' : ''}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <StatusBadge status={task.status} />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{task.summary?.post_title || task.input?.title || 'Task ' + task.id.slice(0, 8)}</p>
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
                        {task.summary && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {task.summary.top_issues?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Problemi</p>
                                <ul className="space-y-1">{task.summary.top_issues.map((i: string, idx: number) => <li key={idx} className="text-xs text-muted-foreground flex gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />{i}</li>)}</ul>
                              </div>
                            )}
                            {task.summary.top_suggestions?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">Suggerimenti</p>
                                <ul className="space-y-1">{task.summary.top_suggestions.map((s: string, idx: number) => <li key={idx} className="text-xs text-muted-foreground flex gap-1.5"><Zap className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />{s}</li>)}</ul>
                              </div>
                            )}
                            {task.summary.passed?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Punti di forza</p>
                                <ul className="space-y-1">{task.summary.passed.map((p: string, idx: number) => <li key={idx} className="text-xs text-muted-foreground flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />{p}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Error log for failed tasks */}
                        {task.status === 'failed' && Array.isArray(task.agents) && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Log errore</p>
                            {task.agents.filter((e: any) => e.step).map((entry: any, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-muted-foreground/50 shrink-0 font-mono">
                                  {new Date(entry.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className={entry.step === 'error' ? 'text-red-400 font-medium' : 'text-muted-foreground'}>{entry.msg}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {task.agents && Array.isArray(task.agents) && task.agents[0]?.id && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Risultati per agente</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {task.agents.map((agent: any) => (
                                <div key={agent.id} className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                      <span className="text-orange-500">{AGENT_ICONS[agent.id] ?? <Bot className="w-4 h-4" />}</span>{agent.name}
                                    </div>
                                    {agent.score != null && <ScoreBadge score={agent.score} />}
                                  </div>
                                  {agent.result?.issues?.slice(0, 2).map((issue: string, i: number) => (
                                    <p key={i} className="text-xs text-muted-foreground mt-1 flex gap-1"><XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />{issue}</p>
                                  ))}
                                  {agent.error && <p className="text-xs text-red-400 mt-1">Errore: {agent.error}</p>}
                                  {agent.duration_ms && <p className="text-xs text-muted-foreground/50 mt-2">{(agent.duration_ms / 1000).toFixed(1)}s</p>}
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
