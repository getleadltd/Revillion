import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

const SITE_URL = 'https://revillion-partners.com';
const SUPPORTED_LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://revillion-partners.com/#organization",
  "name": "Revillion Partners",
  "url": "https://revillion-partners.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://revillion-partners.com/favicon.png"
  },
  "description": "Revillion Partners is an iGaming affiliate network offering CPA, RevShare and hybrid commission models across global markets.",
  "email": "info@revillion.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@revillion.com",
    "contactType": "customer support",
    "availableLanguage": ["English", "German", "Italian", "Spanish", "Portuguese"]
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://revillion-partners.com/#website",
  "url": "https://revillion-partners.com",
  "name": "Revillion Partners",
  "description": "iGaming Affiliate Network - Earn up to $220 CPA",
  "publisher": {
    "@id": "https://revillion-partners.com/#organization"
  },
  "inLanguage": ["en", "de", "it", "pt", "es"]
};

export const SEOHead = () => {
  const { i18n } = useTranslation();
  const { lang } = useParams();

  // The URL is the source of truth. Browser/language-detector preferences must
  // never change a route's canonical or hreflang metadata.
  const currentLanguage: SupportedLanguage = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
    ? lang as SupportedLanguage
    : SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
      ? i18n.resolvedLanguage as SupportedLanguage
      : 'en';
  
  const meta: Record<string, { title: string; description: string }> = {
    en: {
      title: "Revillion Partners - iGaming Affiliate Program",
      description: "Join Revillion Partners' iGaming affiliate network. Access CPA, RevShare and hybrid deals with dedicated support and real-time tracking."
    },
    de: {
      title: "Revillion Partners - iGaming-Partnerprogramm",
      description: "Treten Sie Revillions iGaming-Affiliate-Netzwerk bei. Nutzen Sie CPA-, RevShare- und Hybrid-Deals mit persönlichem Support und Echtzeit-Tracking."
    },
    it: {
      title: "Revillion Partners - Programma Affiliazione iGaming",
      description: "Entra nel network di affiliazione iGaming Revillion. Accedi ad accordi CPA, RevShare e ibridi con supporto dedicato e tracking in tempo reale."
    },
    pt: {
      title: "Revillion Partners - Programa de Afiliados iGaming",
      description: "Junte-se à rede de afiliados iGaming Revillion. Acesse acordos CPA, RevShare e híbridos com suporte dedicado e rastreamento em tempo real."
    },
    es: {
      title: "Revillion Partners - Programa de Afiliados iGaming",
      description: "Únete a la red de afiliados iGaming Revillion. Accede a acuerdos CPA, RevShare e híbridos con soporte dedicado y seguimiento en tiempo real."
    }
  };

  const currentMeta = meta[currentLanguage];
  
  const localeMap: Record<string, string> = {
    en: 'en_US',
    de: 'de_DE',
    it: 'it_IT',
    pt: 'pt_PT',
    es: 'es_ES'
  };

  return (
    <Helmet>
      <html lang={currentLanguage} />
      
      {/* Dynamic Title & Description */}
      <title>{currentMeta.title}</title>
      <meta name="description" content={currentMeta.description} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* OpenGraph Dynamic Tags */}
      <meta property="og:title" content={currentMeta.title} />
      <meta property="og:description" content={currentMeta.description} />
      <meta property="og:locale" content={localeMap[currentLanguage]} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${SITE_URL}/${currentLanguage}`} />
      <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Revillion Partners" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={currentMeta.title} />
      <meta name="twitter:description" content={currentMeta.description} />
      <meta name="twitter:image" content="https://revillion-partners.com/og-image.png" />
      
      {/* Canonical */}
      <link rel="canonical" href={`${SITE_URL}/${currentLanguage}`} />
      
      {/* Alternate languages */}
      {SUPPORTED_LANGUAGES.map((alternateLanguage) => (
        <link
          key={alternateLanguage}
          rel="alternate"
          hrefLang={alternateLanguage}
          href={`${SITE_URL}/${alternateLanguage}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en`} />

      {/* Organization + WebSite structured data — helps AI engines identify the brand entity */}
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
    </Helmet>
  );
};
