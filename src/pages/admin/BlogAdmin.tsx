import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

const BlogAdmin = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const [filter, setFilter] = useState('all');
  
  const { data: posts, isLoading } = useBlogPosts({
    page: 1,
    limit: 100,
    lang,
  });

  return (
    <div className="min-h-screen bg-background p-8">
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

        <Card className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('blog.admin.noPosts')}</p>
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
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title_en}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`blog.categories.${post.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                        {post.status}
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
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BlogAdmin;
