import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export const SEOHead = () => {
  const { i18n } = useTranslation();
  
  const meta: Record<string, { title: string; description: string }> = {
    en: {
      title: "Revillion Partners - High CPA Casino Affiliate Network | $10M+ Paid",
      description: "Join 800+ affiliates earning high CPA commissions. Premium iGaming offers across 40+ markets. $10M+ paid to partners. Real-time tracking & dedicated support."
    },
    it: {
      title: "Revillion Partners - Network Affiliazione Casino Alto CPA | $10M+ Pagati",
      description: "Unisciti a 800+ affiliati che guadagnano alte commissioni CPA. Offerte iGaming premium in 40+ mercati. $10M+ pagati ai partner. Tracking in tempo reale e supporto dedicato."
    },
    pt: {
      title: "Revillion Partners - Rede Afiliados Casino Alto CPA | $10M+ Pagos",
      description: "Junte-se a 800+ afiliados ganhando altas comissões CPA. Ofertas iGaming premium em 40+ mercados. $10M+ pagos aos parceiros. Rastreamento em tempo real e suporte dedicado."
    },
    es: {
      title: "Revillion Partners - Red Afiliados Casino Alto CPA | $10M+ Pagados",
      description: "Únete a 800+ afiliados ganando altas comisiones CPA. Ofertas iGaming premium en 40+ mercados. $10M+ pagados a socios. Seguimiento en tiempo real y soporte dedicado."
    }
  };

  const currentMeta = meta[i18n.language as keyof typeof meta] || meta.en;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{currentMeta.title}</title>
      <meta name="description" content={currentMeta.description} />
      <meta property="og:title" content={currentMeta.title} />
      <meta property="og:description" content={currentMeta.description} />
      <link rel="canonical" href={`https://revillion-partners.com/${i18n.language}`} />
    </Helmet>
  );
};
