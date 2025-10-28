// Google Analytics 4 Helper Functions

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Track a custom event in Google Analytics 4
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track CTA (Call-to-Action) button clicks
 */
export const trackCTAClick = (location: string) => {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: location,
    value: 1
  });
};

/**
 * Track casino partner logo clicks
 */
export const trackPartnerLogoClick = (partnerName: string) => {
  trackEvent('partner_logo_click', {
    event_category: 'engagement',
    event_label: partnerName
  });
};

/**
 * Track section views for scroll tracking
 */
export const trackSectionView = (sectionName: string) => {
  trackEvent('section_view', {
    event_category: 'engagement',
    event_label: sectionName
  });
};

/**
 * Track page view with language
 */
export const trackPageView = (language: string) => {
  trackEvent('page_view', {
    event_category: 'engagement',
    language: language,
    page_path: window.location.pathname
  });
};

/**
 * Track language changes
 */
export const trackLanguageChange = (fromLang: string, toLang: string) => {
  trackEvent('language_switch', {
    event_category: 'engagement',
    from_language: fromLang,
    to_language: toLang
  });
};

/**
 * Track blog post view
 */
export const trackBlogPostView = (slug: string, category: string, lang: string, readingTime: number) => {
  trackEvent('blog_post_view', {
    event_category: 'blog',
    article_slug: slug,
    category: category,
    language: lang,
    reading_time: readingTime
  });
};

/**
 * Track blog CTA clicks
 */
export const trackBlogCTAClick = (location: string, slug: string, lang: string) => {
  trackEvent('blog_cta_click', {
    event_category: 'blog',
    cta_location: location,
    article_slug: slug,
    language: lang
  });
};

/**
 * Track blog article share
 */
export const trackBlogShare = (platform: string, slug: string, lang: string) => {
  trackEvent('blog_share', {
    event_category: 'blog',
    platform: platform,
    article_slug: slug,
    language: lang
  });
};

/**
 * Track related post clicks
 */
export const trackRelatedPostClick = (fromSlug: string, toSlug: string, lang: string) => {
  trackEvent('blog_related_click', {
    event_category: 'blog',
    from_article: fromSlug,
    to_article: toSlug,
    language: lang
  });
};

/**
 * Track blog category filter
 */
export const trackBlogCategoryFilter = (category: string, lang: string) => {
  trackEvent('blog_category_filter', {
    event_category: 'blog',
    category: category,
    language: lang
  });
};
