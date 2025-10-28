import { BlogPost } from '@/data/blogPosts';
import { useTranslation } from 'react-i18next';

interface AuthorBoxProps {
  author: BlogPost['author'];
  lang: string;
}

export const AuthorBox = ({ author, lang }: AuthorBoxProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-muted to-card border border-border rounded-xl p-6 shadow-md">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {author.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">{t('blog.author.by')}</div>
          <h4 className="font-bold text-foreground text-lg mb-2">{author.name}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {author.bio[lang]}
          </p>
        </div>
      </div>
    </div>
  );
};
