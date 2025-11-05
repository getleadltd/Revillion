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
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const formatHTMLContent = (html: string): string => {
  if (!html) return html;
  
  // Normalizza gli spazi multipli e le righe vuote
  let formatted = html.trim();
  
  // Aggiungi spaziatura tra sezioni principali (due righe vuote prima di ogni H2)
  formatted = formatted.replace(/<h2/g, '\n\n<h2');
  
  // Aggiungi spaziatura dopo H2 e H3
  formatted = formatted.replace(/<\/h2>/g, '</h2>\n');
  formatted = formatted.replace(/<\/h3>/g, '</h3>\n');
  
  // Aggiungi spaziatura tra paragrafi
  formatted = formatted.replace(/<\/p>/g, '</p>\n');
  
  // Aggiungi spaziatura dopo liste
  formatted = formatted.replace(/<\/ul>/g, '</ul>\n');
  formatted = formatted.replace(/<\/ol>/g, '</ol>\n');
  
  // Rimuovi righe vuote multiple (max 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Pulisci spazi all'inizio e alla fine
  return formatted.trim();
};
