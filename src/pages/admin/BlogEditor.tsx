import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateSlug } from "@/lib/blog";
import { Loader2 } from "lucide-react";

const schema = z.object({
  title_en: z.string().min(3, "Il titolo deve contenere almeno 3 caratteri"),
  content_en: z.string().min(10, "Il contenuto deve contenere almeno 10 caratteri"),
  category: z.string().min(2, "Seleziona una categoria"),
  status: z.enum(["draft", "published"]),
  slug: z.string().min(3, "Lo slug deve contenere almeno 3 caratteri"),
  featured_image_url: z.string().url("Inserisci un URL valido").optional().or(z.literal("")),
  meta_description_en: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function BlogEditor() {
  const { id, lang = "en" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title_en: "",
      content_en: "",
      category: "news",
      status: "draft",
      slug: "",
      featured_image_url: "",
      meta_description_en: "",
    },
  });

  // Prefill in edit mode
  useEffect(() => {
    if (!id) return;
    
    (async () => {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        toast({ 
          title: "Errore", 
          description: error.message, 
          variant: "destructive" 
        });
        navigate(`/${lang}/admin/blog`);
      } else if (data) {
        form.reset({
          title_en: data.title_en ?? "",
          content_en: data.content_en ?? "",
          category: data.category ?? "news",
          status: (data.status as "draft" | "published") ?? "draft",
          slug: data.slug ?? "",
          featured_image_url: data.featured_image_url ?? "",
          meta_description_en: data.meta_description_en ?? "",
        });
      }
      setInitialLoading(false);
    })();
  }, [id]);

  // Auto-generate slug from title
  const titleValue = form.watch("title_en");
  useEffect(() => {
    if (!id && titleValue) {
      const currentSlug = form.getValues("slug");
      if (!currentSlug || currentSlug.trim().length < 3) {
        form.setValue("slug", generateSlug(titleValue), { shouldValidate: false });
      }
    }
  }, [titleValue, id]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!user) throw new Error("Devi essere autenticato.");

      const baseData = {
        title_en: values.title_en,
        content_en: values.content_en,
        category: values.category,
        status: values.status,
        slug: values.slug,
        featured_image_url: values.featured_image_url || null,
        meta_description_en: values.meta_description_en || null,
        published_at: values.status === "published" ? new Date().toISOString() : null,
      };

      if (!id) {
        // Create new post
        const { error } = await supabase.from("blog_posts").insert([{
          ...baseData,
          author_id: user.id,
          views: 0,
        }]);
        if (error) throw error;
        toast({ 
          title: "Creato", 
          description: "Articolo creato con successo." 
        });
      } else {
        // Update existing post
        const { error } = await supabase
          .from("blog_posts")
          .update(baseData)
          .eq("id", id);
        if (error) throw error;
        toast({ 
          title: "Aggiornato", 
          description: "Articolo aggiornato con successo." 
        });
      }

      navigate(`/${lang}/admin/blog`);
    } catch (e: any) {
      toast({ 
        title: "Errore", 
        description: e.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{id ? "Modifica articolo" : "Nuovo articolo"}</h1>
          <p className="text-muted-foreground mt-2">
            {id ? "Modifica i dettagli dell'articolo" : "Crea un nuovo articolo per il blog"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField 
              name="title_en" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo (EN)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Inserisci il titolo dell'articolo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              name="slug" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="slug-automatico" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              name="category" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="guides">Guides</SelectItem>
                        <SelectItem value="reviews">Reviews</SelectItem>
                        <SelectItem value="tips">Tips</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              name="status" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="published">Pubblicato</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              name="featured_image_url" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immagine di copertina (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://esempio.com/immagine.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              name="meta_description_en" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description (EN)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Breve descrizione per SEO (massimo 160 caratteri)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <FormField 
              name="content_en" 
              control={form.control} 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenuto (EN)</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[300px] font-mono text-sm" 
                      {...field} 
                      placeholder="Inserisci il contenuto dell'articolo in HTML o testo semplice"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/${lang}/admin/blog`)} 
                disabled={loading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {id ? "Salva modifiche" : "Crea articolo"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
