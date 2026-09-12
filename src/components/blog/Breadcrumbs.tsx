import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  currentPage: string;
  className?: string;
}

export const Breadcrumbs = ({ items, currentPage, className = '' }: BreadcrumbsProps) => {
  const location = useLocation();
  const currentUrl = new URL(location.pathname, 'https://revillion-partners.com').href;
  // Generate structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      ...items.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.name,
        "item": item.url
      })),
      {
        "@type": "ListItem",
        "position": items.length + 1,
        "name": currentPage,
        "item": currentUrl
      }
    ]
  };

  return (
    <>
      {/* Inline Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
            .replace(/</g, '\\u003c')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029'),
        }}
      />
      
      {/* Visual Breadcrumbs */}
      <nav 
        className={`flex items-center text-sm text-muted-foreground ${className}`}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
          {items.map((item, index) => (
            <li 
              key={item.position}
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem"
              className="flex items-center gap-2"
            >
              <Link 
                to={item.url} 
                className="hover:text-primary transition-colors"
                itemProp="item"
              >
                <span itemProp="name">{item.name}</span>
              </Link>
              <meta itemProp="position" content={String(item.position)} />
              {index < items.length && <ChevronRight className="h-4 w-4" />}
            </li>
          ))}
          <li 
            itemProp="itemListElement" 
            itemScope 
            itemType="https://schema.org/ListItem"
          >
            <span className="text-foreground font-medium" itemProp="name">
              {currentPage}
            </span>
            <meta itemProp="position" content={String(items.length + 1)} />
          </li>
        </ol>
      </nav>
    </>
  );
};
