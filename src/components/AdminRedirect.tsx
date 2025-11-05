import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const AdminRedirect = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const lang = i18n.language || 'it';
    navigate(`/${lang}/auth/login`, { replace: true });
  }, [navigate, i18n.language]);
  
  return null;
};
