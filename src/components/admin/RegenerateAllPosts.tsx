import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegenerateResult {
  id: string;
  title: string;
  slug: string;
  status: 'success' | 'error';
  message?: string;
  error?: string;
}

interface RegenerateResponse {
  success: boolean;
  message: string;
  total: number;
  successCount: number;
  errorCount: number;
  results: RegenerateResult[];
}

export function RegenerateAllPosts() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RegenerateResponse | null>(null);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    if (!confirm('Sei sicuro di voler rigenerare TUTTI gli articoli con il nuovo AI più umano? Questa operazione richiederà 5-8 minuti e aggiornerà tutti i contenuti mantenendo titoli e URL invariati.')) {
      return;
    }

    setIsRegenerating(true);
    setProgress(0);
    setResults(null);

    try {
      toast({
        title: "🔄 Rigenerazione avviata",
        description: "Processando tutti gli articoli... Questo richiederà alcuni minuti.",
      });

      // Simula progress incrementale (stima ~6 minuti per 10 articoli)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + 1;
        });
      }, 3600); // Incrementa ogni 3.6 secondi circa

      // Chiama edge function
      const { data, error } = await supabase.functions.invoke<RegenerateResponse>('regenerate-all-posts', {
        body: {}
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Errore durante la rigenerazione');
      }

      setResults(data);

      toast({
        title: "✅ Rigenerazione completata!",
        description: `${data.successCount} articoli rigenerati con successo${data.errorCount > 0 ? `, ${data.errorCount} errori` : ''}.`,
      });

    } catch (error: any) {
      console.error('Errore rigenerazione:', error);
      toast({
        variant: "destructive",
        title: "❌ Errore",
        description: error.message || "Errore durante la rigenerazione degli articoli",
      });
      setProgress(0);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-[hsl(var(--primary))]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
              Rigenera Tutti gli Articoli con Nuovo AI
            </CardTitle>
            <CardDescription>
              Rigenera automaticamente tutti i 10 articoli pubblicati con il nuovo prompt "più umano". 
              <strong className="text-[hsl(var(--foreground))]"> Titoli, slug e URL rimangono invariati.</strong>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Box */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cosa succede durante la rigenerazione:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>✅ Contenuto italiano rigenerato con prompt "più umano"</li>
              <li>✅ Tutte le traduzioni (EN, DE, PT, ES) aggiornate automaticamente</li>
              <li>✅ Titoli, slug, URL e immagini rimangono invariati</li>
              <li>⏱️ Tempo stimato: 5-8 minuti per 10 articoli</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Progress Bar */}
        {isRegenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">
                Rigenerazione in corso...
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
              Questa operazione può richiedere diversi minuti. Non chiudere questa pagina.
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 bg-[hsl(var(--muted))] rounded-lg">
              <div>
                <p className="font-medium">Rigenerazione completata!</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {results.successCount} successi, {results.errorCount} errori, {results.total} totali
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border border-[hsl(var(--border))] rounded-lg p-3">
              {results.results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-start gap-2 text-sm p-2 rounded hover:bg-[hsl(var(--muted))]"
                >
                  {result.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {result.slug}
                    </p>
                    {result.error && (
                      <p className="text-xs text-destructive mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setResults(null)}
              className="w-full"
            >
              Chiudi Risultati
            </Button>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="w-full"
          size="lg"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Rigenerazione in corso...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Avvia Rigenerazione Automatica
            </>
          )}
        </Button>

        <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
          Gli articoli rimarranno pubblicati durante la rigenerazione. 
          Potrai verificare i risultati al completamento.
        </p>
      </CardContent>
    </Card>
  );
}
