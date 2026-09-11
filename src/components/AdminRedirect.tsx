import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSiteLanguage } from '@/lib/dashboard';

export const AdminRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const lang = getSiteLanguage(i18n.resolvedLanguage || i18n.language);
    // Get the path after /admin and redirect to /{lang}/admin{path}
    const pathAfterAdmin = location.pathname.replace(/^\/admin/, '');
    const targetPath = pathAfterAdmin ? `/${lang}/admin${pathAfterAdmin}` : `/${lang}/admin`;
    navigate(targetPath, { replace: true });
  }, [navigate, i18n.language, i18n.resolvedLanguage, location.pathname]);
  
  return null;
};
