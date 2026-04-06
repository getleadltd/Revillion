import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock, CheckCircle2, XCircle, Loader2, Play, CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/blog";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isSameMonth, addMonths, subMonths, isToday,
} from "date-fns";
import { it } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export const BlogQueueManager = () => {
  const [titles, setTitles] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"specific" | "auto">("auto");
  const [specificDate, setSpecificDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [interval, setInterval] = useState("2");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queueItems, isLoading } = useQuery({
    queryKey: ['blog-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_queue')
        .select('*')
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const addToQueueMutation = useMutation({
    mutationFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Non autenticato');

      const titleLines = titles.split('\n').filter(t => t.trim());
      if (titleLines.length === 0) throw new Error('Inserisci almeno un titolo');

      const items = titleLines.map((title, index) => {
        let scheduledFor: Date;

        if (scheduleMode === 'specific') {
          scheduledFor = new Date(specificDate);
        } else {
          const start = new Date(startDate);
          const hoursToAdd = parseInt(interval) * index;
          scheduledFor = new Date(start.getTime() + hoursToAdd * 60 * 60 * 1000);
        }

        return {
          title: title.trim(),
          scheduled_for: scheduledFor.toISOString(),
          created_by: user.data.user.id,
          priority: 0
        };
      });

      const { error } = await supabase
        .from('blog_queue')
        .insert(items);

      if (error) throw error;
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['blog-queue'] });
      setTitles("");
      toast({
        title: "Successo!",
        description: `${count} articoli aggiunti alla coda`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_queue')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-queue'] });
      toast({
        title: "Eliminato",
        description: "Articolo rimosso dalla coda",
      });
    }
  });

  const retryItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_queue')
        .update({ 
          status: 'pending',
          error_message: null,
          retry_count: 0
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-queue'] });
      toast({
        title: "Riprogrammato",
        description: "L'articolo sarà processato nel prossimo ciclo",
      });
    }
  });

  const processNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-blog-queue');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-queue'] });
      toast({
        title: "Processamento completato",
        description: `Elaborati ${data.success}/${data.processed} articoli`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return '';
    }
  };

  const stats = queueItems ? {
    pending: queueItems.filter(i => i.status === 'pending').length,
    processing: queueItems.filter(i => i.status === 'processing').length,
    completed: queueItems.filter(i => i.status === 'completed').length,
    failed: queueItems.filter(i => i.status === 'failed').length
  } : { pending: 0, processing: 0, completed: 0, failed: 0 };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">In Attesa</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">In Elaborazione</p>
              <p className="text-2xl font-bold">{stats.processing}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Completati</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Falliti</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add to Queue Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📝 Aggiungi Articoli in Coda</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="titles">Titoli (uno per riga)</Label>
            <Textarea
              id="titles"
              placeholder="Come vincere alle slot online&#10;Migliori bonus casino 2025&#10;Strategie blackjack per principianti"
              value={titles}
              onChange={(e) => setTitles(e.target.value)}
              rows={6}
              className="mt-2"
            />
          </div>

          <div>
            <Label>📅 Programmazione</Label>
            <RadioGroup value={scheduleMode} onValueChange={(v) => setScheduleMode(v as any)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" className="font-normal cursor-pointer">
                  Data specifica (tutti allo stesso momento)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="font-normal cursor-pointer">
                  Distribuzione automatica
                </Label>
              </div>
            </RadioGroup>
          </div>

          {scheduleMode === 'specific' && (
            <div>
              <Label htmlFor="specificDate">Data e ora</Label>
              <Input
                id="specificDate"
                type="datetime-local"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {scheduleMode === 'auto' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Inizia da</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="interval">Intervallo (ore)</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 ora</SelectItem>
                    <SelectItem value="2">2 ore</SelectItem>
                    <SelectItem value="4">4 ore</SelectItem>
                    <SelectItem value="6">6 ore</SelectItem>
                    <SelectItem value="12">12 ore</SelectItem>
                    <SelectItem value="24">24 ore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button
            onClick={() => addToQueueMutation.mutate()}
            disabled={addToQueueMutation.isPending || !titles.trim()}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addToQueueMutation.isPending ? "Aggiungendo..." : "Aggiungi alla Coda"}
          </Button>
        </div>
      </Card>

      {/* Queue: List + Calendar */}
      <Tabs defaultValue="list">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📊 Articoli in Coda</h2>
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="list" className="gap-1.5"><List className="h-4 w-4" />Lista</TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="h-4 w-4" />Calendario</TabsTrigger>
            </TabsList>
            <Button
              onClick={() => processNowMutation.mutate()}
              disabled={processNowMutation.isPending || stats.pending === 0}
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" />
              Elabora Ora
            </Button>
          </div>
        </div>

        {/* LIST VIEW */}
        <TabsContent value="list">
          <Card className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : queueItems && queueItems.length > 0 ? (
              <div className="space-y-3">
                {queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {item.status}
                          </span>
                        </Badge>
                        {item.retry_count > 0 && (
                          <Badge variant="outline">Tentativi: {item.retry_count}</Badge>
                        )}
                      </div>
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Programmato: {formatDate(item.scheduled_for)}
                      </p>
                      {item.error_message && (
                        <p className="text-sm text-red-500 mt-1">Errore: {item.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'failed' && (
                        <Button size="sm" variant="outline"
                          onClick={() => retryItemMutation.mutate(item.id)}
                          disabled={retryItemMutation.isPending}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost"
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        disabled={deleteItemMutation.isPending || item.status === 'processing'}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessun articolo in coda</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* CALENDAR VIEW */}
        <TabsContent value="calendar">
          <Card className="p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCalendarDate(d => subMonths(d, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold capitalize">
                {format(calendarDate, 'MMMM yyyy', { locale: it })}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setCalendarDate(d => addMonths(d, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              {Object.entries(STATUS_COLORS).map(([s, color]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="capitalize text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {(() => {
              const monthStart = startOfMonth(calendarDate);
              const monthEnd = endOfMonth(calendarDate);
              const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
              // Pad start: Monday=0 … Sunday=6
              const startPad = (getDay(monthStart) + 6) % 7;
              const cells = [...Array(startPad).fill(null), ...days];

              return (
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, idx) => {
                    if (!day) return <div key={`pad-${idx}`} />;
                    const dayItems = queueItems?.filter(item =>
                      isSameDay(new Date(item.scheduled_for), day)
                    ) || [];
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[80px] rounded-lg border p-1.5 text-xs transition-colors ${
                          isToday(day) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                        } ${!isSameMonth(day, calendarDate) ? 'opacity-40' : ''}`}
                      >
                        <span className={`font-medium ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayItems.slice(0, 3).map(item => (
                            <div
                              key={item.id}
                              title={item.title}
                              className={`flex items-center gap-1 rounded px-1 py-0.5 truncate ${
                                item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                                item.status === 'processing' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                                item.status === 'completed' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                                'bg-red-500/10 text-red-700 dark:text-red-400'
                              }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[item.status]}`} />
                              <span className="truncate">{item.title}</span>
                            </div>
                          ))}
                          {dayItems.length > 3 && (
                            <div className="text-muted-foreground pl-1">+{dayItems.length - 3} altri</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Card className="p-6 bg-blue-500/5 border-blue-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span>ℹ️</span> Come Funziona l'Automazione
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
          <li>Gli articoli vengono processati automaticamente ogni 30 minuti</li>
          <li>Ogni articolo viene analizzato, generato, tradotto in 5 lingue e pubblicato</li>
          <li>Include link building automatico con 3-5 link interni rilevanti</li>
          <li>Immagine featured generata automaticamente con AI</li>
          <li>Costo stimato: ~5.5 crediti per articolo completo</li>
          <li>Retry automatico fino a 3 volte in caso di errori</li>
        </ul>
      </Card>
    </div>
  );
};
