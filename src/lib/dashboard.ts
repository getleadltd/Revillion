export const SITE_LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;
export type SiteLanguage = typeof SITE_LANGUAGES[number];

const DASHBOARD_LANGUAGES = new Set<string>(SITE_LANGUAGES);

export type DashboardDestination = 'login' | 'registration';

export const getSiteLanguage = (language: string | undefined): SiteLanguage =>
  language && DASHBOARD_LANGUAGES.has(language)
    ? language as SiteLanguage
    : 'en';

export const getDashboardUrl = (
  language: string | undefined,
  destination: DashboardDestination,
) => {
  const safeLanguage = getSiteLanguage(language);
  return `https://dashboard.revillion.com/${safeLanguage}/${destination}`;
};
