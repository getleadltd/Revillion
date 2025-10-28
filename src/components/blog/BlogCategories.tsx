import { useTranslation } from 'react-i18next';

interface BlogCategoriesProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', icon: '📚' },
  { id: 'affiliate-tips', icon: '💡' },
  { id: 'industry-news', icon: '📰' },
  { id: 'success-stories', icon: '🏆' },
  { id: 'tools', icon: '🛠️' },
  { id: 'seo', icon: '📈' }
];

export const BlogCategories = ({ activeCategory, onCategoryChange }: BlogCategoriesProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
            activeCategory === category.id
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105'
              : 'bg-card text-foreground hover:bg-muted border border-border'
          }`}
        >
          <span className="mr-2">{category.icon}</span>
          {t(`blog.categories.${category.id}`)}
        </button>
      ))}
    </div>
  );
};
