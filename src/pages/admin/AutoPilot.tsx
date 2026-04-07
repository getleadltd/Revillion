import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Bot, Zap, Play, RefreshCw, CheckCircle2, Clock, FileText,
  BarChart3, Globe, Image, Target, Star, Loader2, ChevronRight,
  Cpu, Database, Sparkles, TrendingUp, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  ts: string;
  step: string;
  msg: string;
  score?: number;
  [key: string]: any;
}

// ─── Pipeline step definitions ────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: 'analyze',    icon: <BarChart3 className="w-4 h-4" />,  label: 'Analisi titolo',     color: 'text-blue-400' },
  { id: 'generate',  icon: <Sparkles className="w-4 h-4" />,   label: 'Generazione IT',      color: 'text-purple-400' },
  { id: 'image',     icon: <Image className="w-4 h-4" />,       label: 'Immagine AI',         color: 'text-pink-400' },
  { id: 'translate', icon: <Globe className="w-4 h-4" />,       label: 'Traduzione 4 lingue', color: 'text-cyan-400' },
  { id: 'save',      icon: <Database className="w-4 h-4" />,    label: 'Salvataggio DB',      color: 'text-green-400' },
  { id: 'review',    icon: <Bot className="w-4 h-4" />,         label: 'Review 7 agenti',     color: 'text-orange-400' },
  { id: 'published', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Pubblicazione',      color: 'text-emerald-400' },
];

function stepActive(logs: LogEntry[], stepId: string): 'done' | 'active' | 'idle' {
  const stepMap: Record<string, string[]> = {
    analyze:   ['analyze_done', 'generate_start'],
    generate:  ['content_done', 'translate_start'],
    image:     ['image_done', 'save'],
    translate: ['translate_done', 'save'],
    save:      ['saved', 'review_start'],
    review:    ['review_done', 'published', 'not_published'],
    published: ['published'],
  };
  const done = stepMap[stepId] ?? [];
  if (logs.some(l => done.includes(l.step))) return 'done';
  const starts: Record<string, string[]> = {
    analyze:   ['analyze'],
    generate:  ['generate_start'],
    image:     ['generate_start'],
    translate: ['translate_start'],
    save:      ['save'],
    review:    ['review_start'],
    published: ['review_done'],
  };
  const active = starts[stepId] ?? [];
  if (logs.some(l => active.includes(l.step)) && !logs.some(l => done.includes(l.step))) return 'active';
  return 'idle';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutoPilot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const feedRef = useRef<HTMLDivElement>(null);

  const [enabled, setEnabled] = useState(false);
  const [minScore, setMinScore] = useState(70);
  const [dailyLimit, setDailyLimit] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ── Load settings ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_settings').select('key, value').in('key', ['autopilot_enabled', 'autopilot_min_score', 'autopilot_daily_limit']);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setEnabled(map.autopilot_enabled === 'true');
        if (map.autopilot_min_score) setMinScore(parseInt(map.autopilot_min_score));
        if (map.autopilot_daily_limit) setDailyLimit(parseInt(map.autopilot_daily_limit));
      }
      setSettingsLoaded(true);
    }
    load();
  }, []);

  // ── Save setting helper ─────────────────────────────────────────────────────
  async function saveSetting(key: string, value: string) {
    await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
  }

  // ── Toggle autopilot ────────────────────────────────────────────────────────
  const toggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    await saveSetting('autopilot_enabled', next ? 'true' : 'false');
    toast({
      title: next ? '🤖 Autopilot attivato' : '⏸ Autopilot disattivato',
      description: next
        ? 'Gli agenti inizieranno a pubblicare articoli automaticamente.'
        : 'La generazione automatica è in pausa.',
    });
  };

  // ── Save min score ──────────────────────────────────────────────────────────
  const saveScore = async (val: number) => {
    setMinScore(val);
    await saveSetting('autopilot_min_score', String(val));
  };

  // ── Save daily limit ────────────────────────────────────────────────────────
  const saveDailyLimit = async (val: number) => {
    setDailyLimit(val);
    await saveSetting('autopilot_daily_limit', String(val));
  };

  // ── Live tasks feed ─────────────────────────────────────────────────────────
  const { data: tasks } = useQuery({
    queryKey: ['agent-tasks-autopilot'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    refetchInterval: 3000,
  });

  // Scroll feed to bottom when new logs arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [tasks]);

  // ── Queue count ─────────────────────────────────────────────────────────────
  const { data: queueData } = useQuery({
    queryKey: ['blog-queue-pending'],
    queryFn: async () => {
      const { count } = await supabase.from('blog_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      return count ?? 0;
    },
    refetchInterval: 10000,
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const completedToday = tasks?.filter(t => {
    if (t.status !== 'completed') return false;
    const d = new Date(t.completed_at ?? t.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length ?? 0;

  const avgScore = (() => {
    const scored = tasks?.filter(t => t.score != null) ?? [];
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, t) => s + t.score, 0) / scored.length);
  })();

  const runningTask = tasks?.find(t => t.status === 'running');
  const runningLogs: LogEntry[] = Array.isArray(runningTask?.agents) ? (runningTask.agents as unknown as LogEntry[]) : [];

  // ── Manual run ──────────────────────────────────────────────────────────────
  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/autopilot`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        toast({ title: `Errore ${res.status}`, description: text.slice(0, 200), variant: 'destructive' });
        return;
      }

      const json = await res.json();
      if (json.skipped) {
        const reason = json.reason === 'queue_empty'
          ? 'Nessun articolo in coda — aggiungine dalla Coda Automatica.'
          : 'Autopilot disabilitato — attiva il toggle sopra.';
        toast({ title: 'Saltato', description: reason });
      } else if (json.error) {
        toast({ title: 'Errore funzione', description: json.error, variant: 'destructive' });
      } else {
        toast({ title: '✅ Ciclo avviato', description: `Articolo in generazione (Task: ${json.task_id?.slice(0, 8)})` });
        queryClient.invalidateQueries({ queryKey: ['agent-tasks-autopilot'] });
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Errore sconosciuto';
      toast({
        title: 'Funzione non raggiungibile',
        description: `Verifica che "autopilot" sia deployata su Supabase. (${msg})`,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // ── Step log icon ───────────────────────────────────────────────────────────
  function logIcon(step: string) {
    if (step.includes('done') || step === 'published' || step === 'saved') return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />;
    if (step.includes('fail') || step === 'not_published') return <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    if (step === 'start') return <Zap className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    return <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  }

  return (
    <>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <AdminLayout>
        <div className="space-y-6 max-w-5xl mx-auto">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Cpu className="w-8 h-8 text-orange-500" />
                Autopilot AI
              </h1>
              <p className="text-muted-foreground mt-1">
                Gli agenti generano, revisionano e pubblicano articoli in autonomia
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunNow}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Play className="w-4 h-4" />}
              Esegui ora
            </Button>
          </div>

          {/* ── Master toggle ───────────────────────────────────────────────── */}
          <div
            className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ${
              enabled
                ? 'border-orange-500/50 bg-orange-500/5'
                : 'border-border bg-muted/20'
            }`}
          >
            {/* Glow blob */}
            {enabled && (
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            )}

            <div className="flex items-center justify-between relative">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${enabled ? 'bg-orange-500 shadow-[0_0_12px_3px_rgba(249,115,22,0.6)] animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <p className="text-lg font-semibold">
                    {enabled ? 'Autopilot attivo' : 'Autopilot in pausa'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {enabled
                    ? 'Gli agenti AI stanno monitorando la coda e pubblicando automaticamente.'
                    : 'Attiva per avviare la generazione automatica degli articoli.'}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={toggleEnabled}
                disabled={!settingsLoaded}
                className={`relative w-20 h-10 rounded-full transition-all duration-300 outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background ${
                  enabled ? 'bg-orange-500' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-md transition-all duration-300 ${
                    enabled ? 'left-11' : 'left-1'
                  }`}
                />
                <span className="sr-only">{enabled ? 'Disattiva' : 'Attiva'}</span>
              </button>
            </div>

            {/* Settings grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Score minimo pubblicazione</label>
                  <span className={`text-lg font-bold ${
                    minScore >= 80 ? 'text-green-400' :
                    minScore >= 65 ? 'text-yellow-400' :
                    minScore >= 50 ? 'text-orange-400' : 'text-red-400'
                  }`}>{minScore}/100</span>
                </div>
                <Slider
                  value={[minScore]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setMinScore(v)}
                  onValueCommit={([v]) => saveScore(v)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Permissivo</span>
                  <span>Solo ottimi articoli</span>
                </div>
              </div>

              {/* Daily limit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Articoli al giorno</label>
                    <p className="text-xs text-muted-foreground">Best practice Google: max 2-3</p>
                  </div>
                  <span className="text-lg font-bold text-orange-400">{dailyLimit}</span>
                </div>
                <Slider
                  value={[dailyLimit]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([v]) => setDailyLimit(v)}
                  onValueCommit={([v]) => saveDailyLimit(v)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 / giorno</span>
                  <span>10 / giorno</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'In coda', value: queueData ?? '—', icon: <Clock className="w-5 h-5 text-blue-400" />, color: 'blue' },
              { label: 'Pubblicati oggi', value: `${completedToday}/${dailyLimit}`, icon: <FileText className="w-5 h-5 text-green-400" />, color: 'green' },
              { label: 'Score medio', value: avgScore ?? '—', icon: <TrendingUp className="w-5 h-5 text-orange-400" />, color: 'orange' },
            ].map(stat => (
              <Card key={stat.label} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-${stat.color}-500/5 -translate-y-1/3 translate-x-1/3`} />
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Agent pipeline diagram ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Bot className="w-4 h-4 text-orange-500" />
                Pipeline agenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 flex-wrap">
                {PIPELINE_STEPS.map((step, i) => {
                  const status = stepActive(runningLogs, step.id);
                  return (
                    <div key={step.id} className="flex items-center gap-1">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-500 ${
                        status === 'done'
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : status === 'active'
                          ? 'bg-orange-500/15 border-orange-500/50 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      }`}>
                        <span className={status === 'active' ? 'animate-pulse' : ''}>
                          {status === 'active'
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : status === 'done'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : step.icon}
                        </span>
                        {step.label}
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <ChevronRight className={`w-3 h-3 shrink-0 ${status === 'done' ? 'text-green-400/50' : 'text-muted-foreground/30'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {runningTask ? (
                <p className="text-xs text-orange-400 mt-3 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  In elaborazione: "{(runningTask.input as Record<string, unknown>)?.title as string}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-3">
                  Nessun task in esecuzione — la pipeline si attiva ad ogni ciclo
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Live activity feed ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Activity feed
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-tasks-autopilot'] })}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div ref={feedRef} className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                {tasks?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nessuna attività ancora. Aggiungi articoli alla coda e attiva l'autopilot.
                  </p>
                )}
                {tasks?.map((task: any) => {
                  const logs: LogEntry[] = Array.isArray(task.agents) ? task.agents : [];
                  return (
                    <div key={task.id} className="mb-4">
                      {/* Task header */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'running' ? 'bg-orange-500 animate-pulse' :
                          task.status === 'failed' ? 'bg-red-500' : 'bg-muted-foreground/40'
                        }`} />
                        <p className="text-xs font-semibold text-foreground truncate flex-1">
                          {task.input?.title ?? `Task ${task.id.slice(0, 8)}`}
                        </p>
                        {task.score != null && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            task.score >= 80 ? 'bg-green-500/15 text-green-400' :
                            task.score >= 65 ? 'bg-yellow-500/15 text-yellow-400' :
                            task.score >= 50 ? 'bg-orange-500/15 text-orange-400' : 'bg-red-500/15 text-red-400'
                          }`}>{task.score}/100</span>
                        )}
                        <span className="text-xs text-muted-foreground/50">
                          {new Date(task.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Step logs */}
                      <div className="ml-4 space-y-0.5">
                        {logs.map((entry, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground py-0.5">
                            {logIcon(entry.step)}
                            <span className="flex-1">{entry.msg}</span>
                            <span className="text-muted-foreground/40 text-[10px] shrink-0">
                              {new Date(entry.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border/30 mt-3" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </AdminLayout>
    </>
  );
}
