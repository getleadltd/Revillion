import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const VALID_LANGS = ['en', 'de', 'it', 'pt', 'es'];

export const useDynamicLang = () => {
  const { lang } = useParams();
  useEffect(() => {
    if (lang && VALID_LANGS.includes(lang)) {
      document.documentElement.lang = lang;
    }
  }, [lang]);
};
