import { useTranslation } from 'react-i18next';

export const BlogHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {t('blog.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('blog.subtitle')}
        </p>
      </div>
    </section>
  );
};
