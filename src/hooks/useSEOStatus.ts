export interface SEOStatus {
  missingSlugs: string[];
  missingMetaDescriptions: string[];
  missingImageAlt: boolean;
  seoScore: number;
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  totalIssues: number;
}

const LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;

export const calculateSEOStatus = (post: any): SEOStatus => {
  const missingSlugs = LANGUAGES.filter(lang => !post[`slug_${lang}`]);
  const missingMetaDescriptions = LANGUAGES.filter(lang => !post[`meta_description_${lang}`]);
  const missingImageAlt = !!post.featured_image_url && !post.featured_image_alt;

  // Calculate score (100 max)
  let score = 100;
  score -= missingSlugs.length * 10; // -10 per missing slug
  score -= missingMetaDescriptions.length * 8; // -8 per missing meta description
  score -= missingImageAlt ? 20 : 0; // -20 for missing alt text
  score = Math.max(0, score);

  // Determine status
  let status: SEOStatus['status'];
  if (score === 100) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 50) status = 'needs-work';
  else status = 'critical';

  const totalIssues = missingSlugs.length + missingMetaDescriptions.length + (missingImageAlt ? 1 : 0);

  return {
    missingSlugs,
    missingMetaDescriptions,
    missingImageAlt,
    seoScore: score,
    status,
    totalIssues,
  };
};
