import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { migrateAllPostSlugs } from '@/lib/slugUtils';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const SlugMigrationTool = () => {
  const [loading, setLoading] = useState(false);
  const [forceMode, setForceMode] = useState(true); // Default: Force mode ON
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    updated?: number;
    skipped?: number;
    total?: number;
  } | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    const confirmMessage = forceMode
      ? '⚠️ ATTENZIONE: Questa operazione SOVRASCRIVERÀ tutti gli slug esistenti!\n\nGli URL vecchi non funzioneranno più. Vuoi procedere?'
      : 'Vuoi generare automaticamente gli slug tradotti per tutti i post esistenti?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const migrationResult = await migrateAllPostSlugs(forceMode);
      setResult(migrationResult);

      if (migrationResult.success) {
        toast({
          title: '✅ Migrazione completata',
          description: migrationResult.message,
        });
      } else {
        toast({
          title: '❌ Errore migrazione',
          description: migrationResult.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Migrazione Slug Multilingua
        </CardTitle>
        <CardDescription>
          Genera automaticamente gli slug tradotti (slug_en, slug_de, slug_it, slug_pt, slug_es) 
          per tutti i post esistenti basandosi sui titoli tradotti.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle per modalità Force/Safe */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="force-mode" className="text-base font-medium cursor-pointer">
              Modalità Forzata
            </Label>
            <p className="text-sm text-muted-foreground">
              {forceMode 
                ? '⚠️ SOVRASCRIVE tutti gli slug esistenti (consigliato per correggere caratteri speciali)'
                : 'Aggiunge solo gli slug mancanti, mantiene quelli esistenti'
              }
            </p>
          </div>
          <Switch
            id="force-mode"
            checked={forceMode}
            onCheckedChange={setForceMode}
          />
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p>📋 <strong>Cosa fa questo tool:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Legge tutti i post dal database</li>
            <li>Genera slug da title_en, title_de, title_it, title_pt, title_es</li>
            <li>Converte caratteri speciali: ä→ae, ö→oe, ü→ue, ß→ss, á→a, é→e, ñ→n, ç→c</li>
            {forceMode ? (
              <li className="text-orange-600 dark:text-orange-400 font-medium">
                ⚠️ SOVRASCRIVE tutti gli slug esistenti
              </li>
            ) : (
              <li>Aggiunge solo gli slug mancanti (non sovrascrive esistenti)</li>
            )}
            <li>Usa lo slug principale come fallback per slug_it se mancante</li>
          </ul>
        </div>

        <Button 
          onClick={handleMigration} 
          disabled={loading}
          className="w-full"
          variant={forceMode ? 'destructive' : 'default'}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrazione in corso...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {forceMode ? '⚠️ Avvia Migrazione Forzata' : 'Avvia Migrazione'}
            </>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <p className="font-medium">
                  {result.success ? 'Migrazione completata con successo!' : 'Errore durante la migrazione'}
                </p>
                <p className="text-sm">{result.message}</p>
                {result.success && result.total !== undefined && (
                  <div className="text-sm space-y-1">
                    <p>📊 <strong>Statistiche:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Totale post: {result.total}</li>
                      <li>Post aggiornati: {result.updated}</li>
                      <li>Post ignorati: {result.skipped}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
