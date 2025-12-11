import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, Edit, Trash2, ExternalLink, Loader2, Inbox, RefreshCw } from 'lucide-react';
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

export default function IncomingArticles() {
  const { lang = 'en' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Approve and publish mutation
  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-articles'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Articolo pubblicato con successo');
    },
    onError: (error) => {
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
                  {article.featured_image_url && (
                    <div className="w-48 h-32 flex-shrink-0">
                      <img
                        src={article.featured_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
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
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Pubblica
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
