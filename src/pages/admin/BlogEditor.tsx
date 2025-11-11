import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from 'react-helmet-async';
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateSlug, formatHTMLContent } from "@/lib/blog";
import { generateTranslatedSlugs } from "@/lib/slugUtils";
import { Loader2, Sparkles, Upload, ImagePlus } from "lucide-react";
import { AIContentGeneratorDialog, type GeneratedContent } from "@/components/admin/AIContentGeneratorDialog";
import { AIImageGeneratorDialog } from "@/components/admin/AIImageGeneratorDialog";
import { AIContentImageProcessor } from "@/components/admin/AIContentImageProcessor";

const schema = z.object({
  title_it: z.string().min(3, "Il titolo deve essere lungo almeno 3 caratteri"),
  content_it: z.string().min(10, "Il contenuto deve essere lungo almeno 10 caratteri"),
  category: z.string().min(2),
  status: z.enum(["draft","published"]),
  slug: z.string().min(3, "Lo slug deve essere lungo almeno 3 caratteri"),
  featured_image_url: z.string().url().optional().or(z.literal("")),
  featured_image_alt: z.string().optional().or(z.literal("")),
  meta_description_it: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function BlogEditor() {
  const { id, lang = "en" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAIImageGenerator, setShowAIImageGenerator] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [shouldRetranslate, setShouldRetranslate] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title_it: "",
      content_it: "",
      category: "news",
      status: "draft",
      slug: "",
      featured_image_url: "",
      featured_image_alt: "",
      meta_description_it: "",
    },
  });

  useEffect(() => {
    (async () => {
      if (!id) return;
      setInitialLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast({ title: "Errore", description: error.message, variant: "destructive" });
      } else if (data) {
        setOriginalData(data); // Salva dati originali per confronto
        form.reset({
          title_it: data.title_it ?? "",
          content_it: data.content_it ?? "",
          category: data.category ?? "news",
          status: (data.status as "draft"|"published") ?? "draft",
          slug: data.slug ?? "",
          featured_image_url: data.featured_image_url ?? "",
          featured_image_alt: data.featured_image_alt ?? "",
          meta_description_it: data.meta_description_it ?? "",
        });
      }
      setInitialLoading(false);
    })();
  }, [id]);

  // Auto-generate slug from title for new posts
  useEffect(() => {
    if (!id) {
      const title = form.watch("title_it");
      if (title && !form.getValues("slug")) {
        form.setValue("slug", generateSlug(title));
      }
    }
  }, [form.watch("title_it"), id]);

  const handleAIContentGenerated = (generatedContent: GeneratedContent) => {
    // Formatta il contenuto HTML per migliore leggibilità
    const formattedContent = formatHTMLContent(generatedContent.content_it);
    
    form.setValue("title_it", generatedContent.title_it);
    form.setValue("content_it", formattedContent);
    form.setValue("meta_description_it", generatedContent.meta_description_it);
    form.setValue("slug", generatedContent.slug);
    form.setValue("category", generatedContent.category);
    form.setValue("status", "draft");
    
    toast({
      title: "✨ Contenuto generato!",
      description: "Revisionalo e modifica come preferisci prima di salvare.",
    });
  };

  const handleAIImageGenerated = (imageUrl: string, altText: string) => {
    form.setValue("featured_image_url", imageUrl);
    form.setValue("featured_image_alt", altText);
    toast({
      title: "✅ Immagine aggiunta!",
      description: "L'immagine in evidenza è stata caricata con metadati SEO.",
    });
  };

  const handleRegenerateContent = async () => {
    const currentTitle = form.getValues("title_it");
    const currentCategory = form.getValues("category");

    if (!currentTitle || currentTitle.trim() === "") {
      toast({
        title: "Errore",
        description: "Inserisci un titolo prima di rigenerare il contenuto.",
        variant: "destructive",
      });
      return;
    }

    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-content", {
        body: {
          topic: currentTitle,
          category: currentCategory,
          tone: "professional",
          length: "medium",
        },
      });

      if (error) throw error;

      if (data?.generated) {
        const formattedContent = formatHTMLContent(data.generated.content_it);
        
        // Aggiorna SOLO contenuto e meta description, NON titolo e slug
        form.setValue("content_it", formattedContent);
        form.setValue("meta_description_it", data.generated.meta_description_it);
        
        toast({
          title: "🔄 Contenuto rigenerato!",
          description: "Il contenuto è stato aggiornato. Titolo e slug sono rimasti invariati per preservare il SEO.",
        });
      }
    } catch (error: any) {
      console.error("Errore rigenerazione:", error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante la rigenerazione del contenuto.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error("Devi essere autenticato per creare o modificare articoli.");

      let translationData = null;
      
      // Determina se servono le traduzioni
      const needsTranslation = !id || // Nuovo post → sempre tradurre
        shouldRetranslate || // Utente ha chiesto esplicitamente
        // Oppure rileva cambiamenti nei contenuti testuali
        (originalData && (
          originalData.title_it !== values.title_it ||
          originalData.content_it !== values.content_it ||
          originalData.meta_description_it !== values.meta_description_it
        ));

      if (needsTranslation) {
        setTranslating(true);
        
        const { data, error: translationError } = await supabase.functions.invoke(
          'translate-blog-post',
          {
            body: {
              title_it: values.title_it,
              content_it: values.content_it,
              meta_description_it: values.meta_description_it || ""
            }
          }
        );
        
        setTranslating(false);
        
        if (translationError) {
          console.error("Errore traduzione:", translationError);
          const proceed = confirm(
            "Errore durante la traduzione automatica. Vuoi salvare solo la versione italiana?"
          );
          if (!proceed) {
            setLoading(false);
            return;
          }
        } else {
          translationData = data;
        }
      } else if (!needsTranslation && id) {
        // Feedback quando solo l'immagine è cambiata
        toast({
          title: "ℹ️ Traduzioni preservate",
          description: "Solo l'immagine è stata modificata. Le traduzioni esistenti sono state mantenute.",
        });
      }

      // Preparare i dati per il salvataggio
      const baseData: any = {
        title_it: values.title_it,
        content_it: values.content_it,
        meta_description_it: values.meta_description_it || null,
        category: values.category,
        status: values.status,
        slug: values.slug,
        featured_image_url: values.featured_image_url || null,
        featured_image_alt: values.featured_image_alt || null,
        published_at: values.status === "published" ? new Date().toISOString() : null,
      };
      
      // Se ci sono nuove traduzioni, usale
      if (translationData?.translations) {
        Object.assign(baseData, {
          title_en: translationData.translations.en?.title || values.title_it,
          content_en: translationData.translations.en?.content || values.content_it,
          meta_description_en: translationData.translations.en?.meta_description || values.meta_description_it || null,
          
          title_de: translationData.translations.de?.title || null,
          content_de: translationData.translations.de?.content || null,
          meta_description_de: translationData.translations.de?.meta_description || null,
          
          title_es: translationData.translations.es?.title || null,
          content_es: translationData.translations.es?.content || null,
          meta_description_es: translationData.translations.es?.meta_description || null,
          
          title_pt: translationData.translations.pt?.title || null,
          content_pt: translationData.translations.pt?.content || null,
          meta_description_pt: translationData.translations.pt?.meta_description || null,
        });
      } else if (originalData) {
        // Preserva traduzioni esistenti se disponibili
        Object.assign(baseData, {
          title_en: originalData.title_en || values.title_it,
          content_en: originalData.content_en || values.content_it,
          meta_description_en: originalData.meta_description_en || values.meta_description_it || null,
          
          title_de: originalData.title_de || null,
          content_de: originalData.content_de || null,
          meta_description_de: originalData.meta_description_de || null,
          
          title_es: originalData.title_es || null,
          content_es: originalData.content_es || null,
          meta_description_es: originalData.meta_description_es || null,
          
          title_pt: originalData.title_pt || null,
          content_pt: originalData.content_pt || null,
          meta_description_pt: originalData.meta_description_pt || null,
        });
      } else {
        // Nuovo post senza traduzioni (fallback su italiano)
        Object.assign(baseData, {
          title_en: values.title_it,
          content_en: values.content_it,
          meta_description_en: values.meta_description_it || null,
          
          title_de: null,
          content_de: null,
          meta_description_de: null,
          
          title_es: null,
          content_es: null,
          meta_description_es: null,
          
          title_pt: null,
          content_pt: null,
          meta_description_pt: null,
        });
      }

      // Generate translated slugs automatically from titles
      const translatedSlugs = generateTranslatedSlugs({
        title_en: baseData.title_en,
        title_de: baseData.title_de,
        title_it: baseData.title_it,
        title_pt: baseData.title_pt,
        title_es: baseData.title_es,
      });

      // Merge generated slugs with base data
      Object.assign(baseData, translatedSlugs);

      if (!id) {
        // Create
        const { error } = await supabase.from("blog_posts").insert([{
          ...baseData,
          author_id: user.id,
          views: 0,
        }]);
        if (error) throw error;
        toast({ 
          title: "Creato", 
          description: "Articolo creato con traduzioni automatiche in EN, DE, ES, PT." 
        });
      } else {
        // Update
        const { error } = await supabase.from("blog_posts").update(baseData).eq("id", id);
        if (error) throw error;
        toast({ 
          title: "Aggiornato", 
          description: "Articolo aggiornato con traduzioni automatiche." 
        });
      }

      navigate(`/${lang}/admin/blog`);
    } catch (e: any) {
      console.error("Errore salvataggio:", e);
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  if (initialLoading) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{id ? "Modifica Post" : "Nuovo Post"}</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            {id ? "Modifica i campi e salva le modifiche" : "Crea un nuovo articolo per il blog"}
          </p>
        </div>
          
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {!id && (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAIGenerator(true)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  ✨ Genera con AI
                </Button>
                <p className="text-sm text-muted-foreground">
                  Oppure compila manualmente i campi qui sotto
                </p>
              </>
            )}
            {id && (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleRegenerateContent}
                  disabled={regenerating}
                  className="gap-2"
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  🔄 Rigenera Contenuto
                </Button>
                <p className="text-sm text-muted-foreground">
                  Rigenera solo il contenuto, titolo e slug rimangono invariati
                </p>
              </>
            )}
          </div>

          <div className="mb-4 p-3 bg-primary/10 rounded-md border border-primary/20">
            <p className="text-sm text-muted-foreground">
              🌍 <strong>Traduzioni automatiche:</strong> Inserisci il contenuto in italiano, le traduzioni in EN, DE, ES, PT verranno generate automaticamente.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title_it"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo (IT)</FormLabel>
                    <FormControl>
                      <Input placeholder="Inserisci il titolo dell'articolo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="slug-articolo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="guides">Guide</SelectItem>
                        <SelectItem value="reviews">Recensioni</SelectItem>
                        <SelectItem value="tips">Suggerimenti</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="published">Pubblicato</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immagine in Evidenza</FormLabel>
                    <div className="space-y-3">
                      <FormControl>
                        <Input placeholder="https://esempio.com/immagine.jpg" {...field} />
                      </FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            const url = prompt("Inserisci l'URL dell'immagine:");
                            if (url) field.onChange(url);
                          }}
                        >
                          <Upload className="h-4 w-4" />
                          📎 URL Manuale
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setShowAIImageGenerator(true)}
                        >
                          <ImagePlus className="h-4 w-4" />
                          ✨ Genera con AI
                        </Button>
                      </div>
                      {field.value && (
                        <div className="border rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={field.value} 
                            alt="Preview" 
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured_image_alt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt Text Immagine (SEO)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Descrizione alternativa per SEO" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Descrizione dell'immagine per accessibilità e SEO
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description_it"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description (IT)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Breve descrizione per SEO (massimo 160 caratteri)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_it"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenuto (IT)</FormLabel>
                    <div className="space-y-3">
                      <FormControl>
                        <Textarea 
                          placeholder="Inserisci il contenuto dell'articolo (HTML o testo semplice). Usa [AI-IMAGE: descrizione] per inserire immagini AI." 
                          className="min-h-[300px]"
                          {...field} 
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        💡 <strong>Tip:</strong> Scrivi <code>[AI-IMAGE: descrizione immagine]</code> nel contenuto dove vuoi inserire immagini generate dall'AI
                      </div>
                      <AIContentImageProcessor
                        content={field.value}
                        onContentUpdate={field.onChange}
                        articleTitle={form.watch("title_it")}
                        articleSlug={form.watch("slug")}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {id && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                  <Switch
                    checked={shouldRetranslate}
                    onCheckedChange={setShouldRetranslate}
                    id="retranslate"
                  />
                  <Label htmlFor="retranslate" className="cursor-pointer">
                    Rigenera traduzioni automatiche
                  </Label>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(`/${lang}/admin/blog`)} disabled={loading || translating}>
                  Annulla
                </Button>
                <Button type="submit" disabled={loading || translating}>
                  {translating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {translating ? "⚙️ Traduzione in corso..." : loading ? "Salvataggio..." : (id ? "Aggiorna" : "Crea") + " Post"}
                </Button>
              </div>
            </form>
          </Form>

          <AIContentGeneratorDialog
            open={showAIGenerator}
            onOpenChange={setShowAIGenerator}
            onContentGenerated={handleAIContentGenerated}
          />

          <AIImageGeneratorDialog
            open={showAIImageGenerator}
            onOpenChange={setShowAIImageGenerator}
            onImageGenerated={handleAIImageGenerated}
            articleTitle={form.watch("title_it")}
            articleCategory={form.watch("category")}
          />
        </div>
      </AdminLayout>
      </>
    );
  }
