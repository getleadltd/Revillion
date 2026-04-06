import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";

const schema = z.object({
  topic: z.string().min(10, "L'argomento deve essere lungo almeno 10 caratteri"),
  keywords: z.string().optional(),
  category: z.string().min(2),
  tone: z.enum(["professional", "casual", "technical"]),
  length: z.enum(["short", "medium", "long"]),
});

type FormValues = z.infer<typeof schema>;

export interface GeneratedContent {
  title_it: string;
  content_it: string;
  meta_description_it: string;
  slug: string;
  category: string;
  keywords?: string[];
}

interface AIContentGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentGenerated: (content: GeneratedContent) => void;
}

export function AIContentGeneratorDialog({
  open,
  onOpenChange,
  onContentGenerated,
}: AIContentGeneratorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      topic: "",
      keywords: "",
      category: "affiliate-tips",
      tone: "professional",
      length: "medium",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setProgress("🔍 Gemini 2.5 Pro analizza argomento e keyword...");

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress("✍️ Generazione contenuto long-form con FAQ schema...");

      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic: values.topic,
          keywords: values.keywords || undefined,
          category: values.category,
          tone: values.tone,
          length: values.length,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Errore durante la generazione');
      }

      if (!data || !data.generated) {
        throw new Error('Risposta non valida dal server');
      }

      setProgress("🔗 Integrazione link interni e FAQ schema...");
      await new Promise(resolve => setTimeout(resolve, 400));
      setProgress("✅ Articolo pronto!");
      await new Promise(resolve => setTimeout(resolve, 300));

      const faqCount = data.generated.faq_items?.length || 0;
      const wordCount = data.generated.estimated_word_count;
      const schemaType = data.generated.schema_type;

      toast({
        title: "✨ Articolo generato!",
        description: `${wordCount ? `~${wordCount} parole · ` : ''}${faqCount} FAQ · Schema ${schemaType || 'Article'} · Revisiona prima di pubblicare.`,
      });

      onContentGenerated(data.generated);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error generating content:', error);
      
      let errorMessage = 'Errore durante la generazione del contenuto';
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Troppe richieste AI. Riprova tra qualche minuto.';
      } else if (error.message?.includes('Crediti')) {
        errorMessage = 'Crediti AI esauriti. Contatta l\'amministratore.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Genera Articolo con AI
          </DialogTitle>
          <DialogDescription>
            Powered by Gemini 2.5 Pro. Genera articolo con FAQ schema, internal links, featured snippet, tabelle HTML e struttura ottimizzata per posizione #1 su Google.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Argomento dell'articolo *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Es: 'Come diventare affiliato casino online nel 2025' o 'CPA vs RevShare: quale conviene di più?'"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    🎯 <strong>Scrivi per affiliati</strong>, non per giocatori. Il blog attrae chi vuole guadagnare promuovendo casino.
                  </FormDescription>
                  <FormMessage />
                  {/* Quick topic suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "Come diventare affiliato casino online",
                      "CPA vs RevShare casino",
                      "Guadagnare con Telegram e casino",
                      "Migliori GEO per affiliati iGaming",
                      "SEO per siti affiliati casino",
                      "Come aumentare conversioni CPA",
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(t)}
                        className="text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parole chiave SEO (opzionale)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Es: blackjack online, strategie vincenti, casino live"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Keywords separate da virgola. Se non specificate, l'AI le suggerirà automaticamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="affiliate-tips">🎯 Consigli Affiliati</SelectItem>
                        <SelectItem value="guides">📖 Guide</SelectItem>
                        <SelectItem value="industry-updates">📰 Aggiornamenti Settore</SelectItem>
                        <SelectItem value="casino-reviews">⭐ Recensioni Casino</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tono</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="professional">Professionale</SelectItem>
                        <SelectItem value="casual">Informale</SelectItem>
                        <SelectItem value="technical">Tecnico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunghezza</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="short">Breve (~600 parole)</SelectItem>
                        <SelectItem value="medium">Medio (~1100 parole)</SelectItem>
                        <SelectItem value="long">Lungo (~2000 parole)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {loading && progress && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Genera Contenuto
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
