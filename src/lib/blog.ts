export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const generateSlug = (title: string): string => {
  // Character mapping for special characters to ASCII equivalents
  const charMap: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c'
  };

  return title
    .toLowerCase()
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const formatHTMLContent = (html: string): string => {
  if (!html) return html;
  
  let formatted = html.trim();
  
  // Aggiungi margini generosi prima degli H2 (sezioni principali)
  formatted = formatted.replace(/<h2/g, '\n\n\n<h2');
  
  // Spaziatura dopo headings
  formatted = formatted.replace(/<\/h2>/g, '</h2>\n\n');
  formatted = formatted.replace(/<\/h3>/g, '</h3>\n');
  
  // Doppio spazio tra paragrafi
  formatted = formatted.replace(/<\/p>/g, '</p>\n\n');
  
  // Spazio attorno alle liste
  formatted = formatted.replace(/<ul/g, '\n<ul');
  formatted = formatted.replace(/<ol/g, '\n<ol');
  formatted = formatted.replace(/<\/ul>/g, '</ul>\n\n');
  formatted = formatted.replace(/<\/ol>/g, '</ol>\n\n');
  
  // Assicura che <strong> sia effettivamente bold
  formatted = formatted.replace(/<strong>/g, '<strong class="font-bold">');
  
  // FAQ styling: wrappa ogni coppia h4 (domanda) + p (risposta) in un card
  formatted = formatted.replace(
    /<h4([^>]*)>([^<]+)<\/h4>\s*\n*\s*<p>([^<]*(?:<[^\/][^>]*>[^<]*<\/[^>]+>[^<]*)*)<\/p>/g,
    '<div class="faq-item"><p class="faq-question"><strong>$2</strong></p><p class="faq-answer">$3</p></div>'
  );
  
  // Pattern alternativo: paragrafo con strong (domanda) seguito da paragrafo normale (risposta)
  formatted = formatted.replace(
    /<p><strong([^>]*)>([^<]+)<\/strong><\/p>\s*\n*\s*<p>([^<]+)<\/p>/g,
    '<div class="faq-item"><p class="faq-question"><strong$1>$2</strong></p><p class="faq-answer">$3</p></div>'
  );
  
  // Rimuovi eccessive righe vuote (max 3)
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  
  return formatted.trim();
};
