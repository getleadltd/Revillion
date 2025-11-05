import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';

interface BlogSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const BlogSidebar = ({ selectedCategory, onCategoryChange }: BlogSidebarProps) => {
  const { t } = useTranslation();
  const { data: categories } = useCategories();

  const allCategories = [
    { id: 'all', label: t('blog.allPosts') },
    { id: 'guides', label: t('blog.categories.guides') },
    { id: 'news', label: t('blog.categories.news') },
    { id: 'casino-reviews', label: t('blog.categories.casino-reviews') },
  ];

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>{t('blog.categories')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allCategories.map((category) => {
          const count = categories?.find((c) => c.category === category.id)?.count || 0;
          
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'ghost'}
              className="w-full justify-between"
              onClick={() => onCategoryChange(category.id)}
            >
              <span>{category.label}</span>
              {category.id !== 'all' && <span className="text-sm">({count})</span>}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
