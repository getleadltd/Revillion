import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useBlogPostsAdmin } from '@/hooks/useBlogPostsAdmin';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/blog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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

const BlogAdmin = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  
  const { data: posts, isLoading } = useBlogPostsAdmin({
    page: 1,
    limit: 100,
    lang,
    statusFilter,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const publishedCount = posts?.filter(p => p.status === 'published').length || 0;
  const draftCount = posts?.filter(p => p.status === 'draft').length || 0;
  const totalCount = posts?.length || 0;

  const handleDeletePost = async (postId: string, postTitle: string) => {
    setDeletingPostId(postId);
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });

      toast({
        title: "Post eliminato",
        description: `"${postTitle}" è stato eliminato con successo.`,
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il post. Riprova.",
        variant: "destructive",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <Layout>
      <div className="bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('blog.admin.title')}</h1>
              <p className="text-muted-foreground">{t('blog.admin.subtitle')}</p>
            </div>
            <Button asChild>
              <Link to={`/${lang}/admin/blog/new`}>
                <Plus className="h-4 w-4 mr-2" />
                {t('blog.admin.newPost')}
              </Link>
            </Button>
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="all">Tutti ({totalCount})</TabsTrigger>
              <TabsTrigger value="published">Pubblicati ({publishedCount})</TabsTrigger>
              <TabsTrigger value="draft">Bozze ({draftCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              <Card className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !posts || posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      {statusFilter === 'draft' ? 'Nessuna bozza trovata' : 
                       statusFilter === 'published' ? 'Nessun post pubblicato' : 
                       t('blog.admin.noPosts')}
                    </p>
                    <Button asChild>
                      <Link to={`/${lang}/admin/blog/new`}>
                        {t('blog.admin.createFirst')}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('blog.admin.table.title')}</TableHead>
                        <TableHead>{t('blog.admin.table.category')}</TableHead>
                        <TableHead>{t('blog.admin.table.status')}</TableHead>
                        <TableHead>{t('blog.admin.table.date')}</TableHead>
                        <TableHead>{t('blog.admin.table.views')}</TableHead>
                        <TableHead className="text-right">{t('blog.admin.table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id} className={post.status === 'draft' ? 'bg-muted/30' : ''}>
                          <TableCell className="font-medium">{post.title_en}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {t(`blog.categories.${post.category}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                              {post.status === 'published' ? '✅ Pubblicato' : '📝 Bozza'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(post.published_at || post.created_at)}</TableCell>
                          <TableCell>{post.views}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/${lang}/admin/blog/edit/${post.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={deletingPostId === post.id}
                                  >
                                    {deletingPostId === post.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sei sicuro di voler eliminare "{post.title_en}"? 
                                      Questa azione non può essere annullata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePost(post.id, post.title_en)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Elimina
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default BlogAdmin;
