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
  
  // Rimuovi eccessive righe vuote (max 3)
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  
  return formatted.trim();
};
