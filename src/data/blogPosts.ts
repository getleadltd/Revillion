export interface BlogPost {
  slug: string;
  title: Record<string, string>;
  excerpt: Record<string, string>;
  content: Record<string, string>;
  category: string;
  author: {
    name: string;
    avatar: string;
    bio: Record<string, string>;
  };
  publishedAt: string;
  readingTime: number;
  featuredImage: string;
  tags: string[];
  metaTitle: Record<string, string>;
  metaDescription: Record<string, string>;
  keywords: Record<string, string>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "casino-affiliate-marketing-guide-2025",
    title: {
      en: "How to Start Casino Affiliate Marketing in 2025: Complete Beginner's Guide",
      de: "Casino-Affiliate-Marketing 2025: Kompletter Einsteiger-Leitfaden",
      it: "Come Iniziare con l'Affiliate Marketing dei Casino nel 2025: Guida Completa",
      pt: "Como Começar com Marketing de Afiliados de Cassino em 2025: Guia Completo",
      es: "Cómo Empezar con Marketing de Afiliados de Casino en 2025: Guía Completa"
    },
    excerpt: {
      en: "Learn how to start earning as a casino affiliate in 2025. Complete guide covering platforms, traffic strategies, and commission models.",
      de: "Erfahren Sie, wie Sie 2025 als Casino-Affiliate Geld verdienen können. Vollständiger Leitfaden über Plattformen, Traffic-Strategien und Provisionsmodelle.",
      it: "Scopri come iniziare a guadagnare come affiliato di casino nel 2025. Guida completa su piattaforme, strategie di traffico e modelli di commissione.",
      pt: "Aprenda como começar a ganhar como afiliado de cassino em 2025. Guia completo sobre plataformas, estratégias de tráfego e modelos de comissão.",
      es: "Aprende cómo empezar a ganar como afiliado de casino en 2025. Guía completa sobre plataformas, estrategias de tráfico y modelos de comisión."
    },
    content: {
      en: "Complete beginner guide to casino affiliate marketing in 2025. Learn how to choose programs, build platforms, create content, and start earning.",
      de: "Vollständiger Einsteigerleitfaden zum Casino-Affiliate-Marketing 2025.",
      it: "Guida completa per principianti al marketing di affiliazione dei casinò nel 2025.",
      pt: "Guia completo para iniciantes sobre marketing de afiliados de cassino em 2025.",
      es: "Guía completa para principiantes sobre marketing de afiliados de casino en 2025."
    },
    category: "affiliate-tips",
    author: {
      name: "Revillion Partners Team",
      avatar: "/blog/author-revillion.jpg",
      bio: {
        en: "The Revillion Partners team has over 10 years of combined experience in casino affiliate marketing and iGaming industry expertise.",
        de: "Das Revillion Partners Team verfügt über mehr als 10 Jahre kombinierte Erfahrung im Casino-Affiliate-Marketing und iGaming-Branchenexpertise.",
        it: "Il team di Revillion Partners ha oltre 10 anni di esperienza combinata nel marketing di affiliazione dei casinò e nell'industria iGaming.",
        pt: "A equipe da Revillion Partners possui mais de 10 anos de experiência combinada em marketing de afiliados de cassino e expertise no setor iGaming.",
        es: "El equipo de Revillion Partners tiene más de 10 años de experiencia combinada en marketing de afiliados de casino y experiencia en la industria iGaming."
      }
    },
    publishedAt: "2025-01-15",
    readingTime: 12,
    featuredImage: "/blog/casino-affiliate-guide.jpg",
    tags: ["affiliate marketing", "casino", "beginner guide", "CPA", "2025"],
    metaTitle: {
      en: "How to Start Casino Affiliate Marketing in 2025 | Complete Guide",
      de: "Casino-Affiliate-Marketing starten 2025 | Kompletter Leitfaden",
      it: "Come Iniziare l'Affiliate Marketing dei Casino nel 2025 | Guida Completa",
      pt: "Como Começar Marketing de Afiliados de Cassino em 2025 | Guia Completo",
      es: "Cómo Empezar Marketing de Afiliados de Casino en 2025 | Guía Completa"
    },
    metaDescription: {
      en: "Learn how to start earning as a casino affiliate in 2025. Complete guide covering platforms, traffic strategies, and commission models. Start today!",
      de: "Erfahren Sie, wie Sie 2025 als Casino-Affiliate verdienen. Kompletter Leitfaden zu Plattformen, Traffic-Strategien und Provisionsmodellen. Jetzt starten!",
      it: "Scopri come guadagnare come affiliato casino nel 2025. Guida completa su piattaforme, strategie traffico e modelli commissione. Inizia oggi!",
      pt: "Aprenda a ganhar como afiliado de cassino em 2025. Guia completo sobre plataformas, estratégias de tráfego e modelos de comissão. Comece hoje!",
      es: "Aprende a ganar como afiliado de casino en 2025. Guía completa sobre plataformas, estrategias de tráfico y modelos de comisión. ¡Empieza hoy!"
    },
    keywords: {
      en: "casino affiliate marketing, start casino affiliate, igaming affiliate guide, casino CPA, affiliate marketing 2025",
      de: "Casino-Affiliate-Marketing, Casino-Affiliate starten, iGaming-Affiliate-Leitfaden, Casino-CPA, Affiliate-Marketing 2025",
      it: "marketing affiliazione casino, iniziare affiliazione casino, guida affiliazione igaming, CPA casino, affiliate marketing 2025",
      pt: "marketing afiliados cassino, começar afiliado cassino, guia afiliado igaming, CPA cassino, marketing afiliados 2025",
      es: "marketing afiliados casino, empezar afiliado casino, guía afiliado igaming, CPA casino, marketing afiliados 2025"
    }
  }
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find(post => post.slug === slug);
};

export const getBlogPostsByCategory = (category: string): BlogPost[] => {
  if (category === 'all') return blogPosts;
  return blogPosts.filter(post => post.category === category);
};

export const getRelatedPosts = (currentSlug: string, category: string, limit: number = 3): BlogPost[] => {
  return blogPosts
    .filter(post => post.slug !== currentSlug && post.category === category)
    .slice(0, limit);
};
