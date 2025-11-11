import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const SEOHead = () => {
  const { i18n } = useTranslation();
  
  const meta: Record<string, { title: string; description: string }> = {
    en: {
      title: "Revillion Partners - iGaming Affiliate Program",
      description: "Join Revillion's elite affiliate network. Earn premium CPA commissions promoting 16+ casino brands with dedicated support & real-time tracking."
    },
    de: {
      title: "Revillion Partners - iGaming-Partnerprogramm",
      description: "Treten Sie Revillions Elite-Affiliate-Netzwerk bei. Verdienen Sie Premium-CPA-Provisionen mit 16+ Casino-Marken und dediziertem Support."
    },
    it: {
      title: "Revillion Partners - Programma Affiliazione iGaming",
      description: "Entra nella rete di affiliazione elite di Revillion. Guadagna commissioni CPA premium promuovendo 16+ brand di casino con supporto dedicato."
    },
    pt: {
      title: "Revillion Partners - Programa de Afiliados iGaming",
      description: "Junte-se à rede de afiliados elite da Revillion. Ganhe comissões CPA premium promovendo 16+ marcas de cassino com suporte dedicado."
    },
    es: {
      title: "Revillion Partners - Programa de Afiliados iGaming",
      description: "Únete a la red de afiliados elite de Revillion. Gana comisiones CPA premium promocionando 16+ marcas de casino con soporte dedicado."
    }
  };

  const currentMeta = meta[i18n.language as keyof typeof meta] || meta.en;
  
  const localeMap: Record<string, string> = {
    en: 'en_US',
    de: 'de_DE',
    it: 'it_IT',
    pt: 'pt_BR',
    es: 'es_ES'
  };

  return (
    <Helmet>
      <html lang={i18n.language} />
      
      {/* Dynamic Title & Description */}
      <title>{currentMeta.title}</title>
      <meta name="description" content={currentMeta.description} />
      <meta name="app-build" content={new Date().toISOString()} />
      
      {/* OpenGraph Dynamic Tags */}
      <meta property="og:title" content={currentMeta.title} />
      <meta property="og:description" content={currentMeta.description} />
      <meta property="og:locale" content={localeMap[i18n.language as keyof typeof localeMap] || 'en_US'} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://revillion-partners.com/${i18n.language}`} />
      
      {/* Twitter Dynamic Tags */}
      <meta name="twitter:title" content={currentMeta.title} />
      <meta name="twitter:description" content={currentMeta.description} />
      
      {/* Canonical */}
      <link rel="canonical" href={`https://revillion-partners.com/${i18n.language}`} />
      
      {/* Alternate languages */}
      <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en" />
      <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de" />
      <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it" />
      <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt" />
      <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es" />
      <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en" />
    </Helmet>
  );
};
