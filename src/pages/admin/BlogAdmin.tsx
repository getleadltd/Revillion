import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBlogPostsAdmin } from '@/hooks/useBlogPostsAdmin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const LIMIT = 20;

const BlogAdmin = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBlogPostsAdmin({
    page,
    limit: LIMIT,
    lang,
    statusFilter,
    search,
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const handleDeletePost = async (postId: string, postTitle: string) => {
    setDeletingPostId(postId);
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast({ title: 'Post eliminato', description: `"${postTitle}" eliminato.` });
    } catch (error) {
      toast({ title: 'Errore', description: 'Impossibile eliminare il post.', variant: 'destructive' });
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (value: string) => {
    setStatusFilter(value as typeof statusFilter);
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('blog.admin.title')}</h1>
              <p className="text-[hsl(var(--muted-foreground))]">{t('blog.admin.subtitle')}</p>
            </div>
            <Button asChild>
              <Link to={`/${lang}/admin/blog/new`}>
                <Plus className="h-4 w-4 mr-2" />
                {t('blog.admin.newPost')}
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per titolo o slug..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">Tutti ({total})</TabsTrigger>
              <TabsTrigger value="published">Pubblicati</TabsTrigger>
              <TabsTrigger value="draft">Bozze</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              <Card className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      {search
                        ? `Nessun risultato per "${search}"`
                        : statusFilter === 'draft' ? 'Nessuna bozza trovata'
                        : statusFilter === 'published' ? 'Nessun post pubblicato'
                        : t('blog.admin.noPosts')}
                    </p>
                    {!search && (
                      <Button asChild>
                        <Link to={`/${lang}/admin/blog/new`}>{t('blog.admin.createFirst')}</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('blog.admin.table.title')}</TableHead>
                          <TableHead>{t('blog.admin.table.category')}</TableHead>
                          <TableHead>{t('blog.admin.table.status')}</TableHead>
                          <TableHead>{t('blog.admin.table.date')}</TableHead>
                          <TableHead className="text-right">{t('blog.admin.table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow key={post.id} className={post.status === 'draft' ? 'bg-muted/30' : ''}>
                            <TableCell className="font-medium max-w-xs truncate">{post.title_en || post.title_it}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{t(`blog.categories.${post.category}`)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                                {post.status === 'published' ? '✅ Pubblicato' : '📝 Bozza'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(post.published_at || post.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/${lang}/admin/blog/edit/${post.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" disabled={deletingPostId === post.id}>
                                      {deletingPostId === post.id
                                        ? <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                        : <Trash2 className="h-4 w-4 text-destructive" />}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Eliminare "{post.title_en || post.title_it}"? Questa azione non può essere annullata.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePost(post.id, post.title_en || post.title_it || '')}
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} di {total} articoli
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">
                            {page} / {totalPages}
                          </span>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
};

export default BlogAdmin;
