import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface ToCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<ToCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const extractHeadings = () => {
      const regex = /^(#{2,3})\s+(.+)$/gm;
      const matches = [...content.matchAll(regex)];
      
      const items: ToCItem[] = matches.map((match, index) => ({
        id: `heading-${index}`,
        text: match[2],
        level: match[1].length
      }));
      
      setHeadings(items);
    };

    extractHeadings();
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    const elements = document.querySelectorAll('h2, h3');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToHeading = (index: number) => {
    const element = document.querySelectorAll('h2, h3')[index];
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 bg-card border border-border rounded-xl p-6 shadow-md">
      <div className="flex items-center mb-4">
        <List className="w-5 h-5 text-orange-500 mr-2" />
        <h3 className="font-bold text-foreground">Table of Contents</h3>
      </div>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
              <button
                onClick={() => scrollToHeading(index)}
                className={`text-left text-sm transition-colors hover:text-orange-500 ${
                  activeId === `heading-${index}` 
                    ? 'text-orange-500 font-semibold' 
                    : 'text-muted-foreground'
                }`}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
