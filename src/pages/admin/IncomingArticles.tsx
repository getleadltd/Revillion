import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, Edit, Trash2, Loader2, Inbox, RefreshCw, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/blog';

export default function IncomingArticles() {
  const { lang = 'en' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Fetch incoming articles (draft + source = babylovegrowth)
  const { data: articles, isLoading, refetch } = useQuery({
    queryKey: ['incoming-articles', lang],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'draft')
        .eq('source', 'babylovegrowth')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Approve and publish mutation with automatic translations
  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      setPublishingId(postId);
      
      // 1. Fetch the full article
      const { data: article, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (fetchError || !article) {
        throw new Error('Failed to fetch article');
      }

      // 2. Determine source language and content
      const sourceLang = (article as any).source_language || 'en';
      const sourceTitle = article[`title_${sourceLang}` as keyof typeof article] || article.title_en;
      const sourceContent = article[`content_${sourceLang}` as keyof typeof article] || article.content_en;
      const sourceMetaDesc = article[`meta_description_${sourceLang}` as keyof typeof article] || article.meta_description_en || '';

      console.log(`Generating translations for article from ${sourceLang}:`, sourceTitle);
      
      // 3. Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // 4. Call translate-blog-post with fetch() and 3-minute timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

      let translationData: any;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-blog-post`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              title: sourceTitle,
              content: sourceContent,
              meta_description: sourceMetaDesc,
              source_language: sourceLang,
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Translation API error:', errorText);
          throw new Error('Translation failed');
        }
        
        translationData = await response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Traduzione scaduta dopo 3 minuti - riprova');
        }
        throw err;
      }

      console.log('Translations received:', Object.keys(translationData?.translations || {}));

      // 4. Build update data with all translations
      const translations = translationData?.translations || {};
      
      const updateData: Record<string, any> = {
        status: 'published',
        published_at: new Date().toISOString(),
      };

      // Keep original source content and add translations
      const languages = ['en', 'de', 'it', 'pt', 'es'];
      
      for (const lang of languages) {
        if (lang === sourceLang) {
          // Keep original content for source language
          updateData[`title_${lang}`] = article[`title_${lang}` as keyof typeof article];
          updateData[`content_${lang}`] = article[`content_${lang}` as keyof typeof article];
          updateData[`meta_description_${lang}`] = article[`meta_description_${lang}` as keyof typeof article];
          updateData[`slug_${lang}`] = article[`slug_${lang}` as keyof typeof article] || article.slug;
        } else if (translations[lang]) {
          // Use translations for other languages
          updateData[`title_${lang}`] = translations[lang].title || null;
          updateData[`content_${lang}`] = translations[lang].content || null;
          updateData[`meta_description_${lang}`] = translations[lang].meta_description || null;
          // Generate slug from translated title
          if (translations[lang].title) {
            updateData[`slug_${lang}`] = generateSlug(translations[lang].title);
          }
        }
      }

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', postId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setPublishingId(null);
      queryClient.invalidateQueries({ queryKey: ['incoming-articles'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Articolo pubblicato con traduzioni in tutte le lingue');
    },
    onError: (error) => {
      setPublishingId(null);
      toast.error(`Errore durante la pubblicazione: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-articles'] });
      toast.success('Articolo eliminato');
    },
    onError: (error) => {
      toast.error(`Errore durante l'eliminazione: ${error.message}`);
    },
  });

  const getLocalizedTitle = (post: any) => {
    const titleKey = `title_${lang}` as keyof typeof post;
    return post[titleKey] || post.title_en || 'Senza titolo';
  };

  const getLocalizedExcerpt = (post: any) => {
    const contentKey = `content_${lang}` as keyof typeof post;
    const content = post[contentKey] || post.content_en || '';
    // Strip HTML and get first 150 chars
    const textContent = content.replace(/<[^>]+>/g, '');
    return textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
  };

  // Check if article has translations
  const hasTranslations = (post: any) => {
    return post.title_de || post.title_it || post.title_pt || post.title_es;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Articoli in Arrivo</h1>
            <p className="text-muted-foreground">
              Articoli ricevuti da BabyLoveGrowth.ai in attesa di revisione
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden">
                <div className="flex">
                  {/* Image thumbnail */}
                  {article.featured_image_url ? (
                    <div className="w-48 h-32 flex-shrink-0">
                      <img
                        src={article.featured_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-32 flex-shrink-0 bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            BabyLoveGrowth.ai
                          </Badge>
                          <Badge variant="outline">{article.category}</Badge>
                          {!hasTranslations(article) && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <Languages className="h-3 w-3 mr-1" />
                              Solo EN
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg truncate">
                          {getLocalizedTitle(article)}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {getLocalizedExcerpt(article)}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          Ricevuto il {format(new Date(article.created_at || ''), 'dd MMM yyyy, HH:mm', { locale: it })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => approveMutation.mutate(article.id)}
                          disabled={approveMutation.isPending || publishingId === article.id}
                        >
                          {publishingId === article.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              Traduzione...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Pubblica
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/${lang}/admin/blog/edit/${article.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Elimina articolo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler eliminare questo articolo? Questa azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(article.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl mb-2">Nessun articolo in arrivo</CardTitle>
              <CardDescription>
                Gli articoli generati da BabyLoveGrowth.ai appariranno qui per la revisione
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}