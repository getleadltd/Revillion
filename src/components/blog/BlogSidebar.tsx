import { useTranslation } from 'react-i18next';
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
    <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {t('blog.categories')}
      </h3>
      <div className="space-y-1.5">
        {allCategories.map((category) => {
          const count = categories?.find((c) => c.category === category.id)?.count || 0;
          const isActive = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                )}
                {category.label}
              </span>
              {category.id !== 'all' && (
                <span className={`text-xs ${isActive ? 'text-orange-400' : 'text-muted-foreground/60'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
