import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Sparkles } from 'lucide-react';
import { useState } from 'react';

const CategoryBreadcrumb = ({ items = [] }) => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // items should be an array of { name, slug, url }
  const breadcrumbItems = [
    { name: 'হোম', url: '/' },
    ...items,
  ];

  // Schema.org structured data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${window.location.origin}${item.url}`,
    })),
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      <nav 
        aria-label="Breadcrumb" 
        className="py-4 bg-white/50 backdrop-blur-sm rounded-2xl px-4 mb-6"
      >
        <ol className="flex items-center flex-wrap text-sm">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isFirst = index === 0;
            const isHovered = hoveredIndex === index;

            return (
              <li 
                key={index} 
                className="flex items-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Separator */}
                {index > 0 && (
                  <div className="flex items-center mx-2">
                    <ChevronRight className={`
                      w-4 h-4 transition-all duration-300
                      ${isHovered ? 'text-primary-400 translate-x-0.5' : 'text-neutral-300'}
                    `} />
                  </div>
                )}

                {/* Breadcrumb Item */}
                {isLast ? (
                  // Last item (current page)
                  <span
                    className={`
                      flex items-center px-3 py-1.5 rounded-full font-medium transition-all duration-300
                      bg-primary-50 text-primary-700 border border-primary-200
                      ${isFirst ? 'pl-2' : ''}
                    `}
                    aria-current="page"
                  >
                    {isFirst && (
                      <Home className="w-4 h-4 mr-1.5 text-primary-500" />
                    )}
                    <span className="font-bangla truncate max-w-[200px] sm:max-w-xs">
                      {item.name}
                    </span>
                    <Sparkles className="w-3 h-3 ml-1.5 text-primary-400 animate-pulse" />
                  </span>
                ) : (
                  // Link items
                  <Link
                    to={item.url}
                    className={`
                      flex items-center px-3 py-1.5 rounded-full transition-all duration-300
                      ${isFirst ? 'pl-2' : ''}
                      ${isHovered 
                        ? 'bg-primary-50 text-primary-600 shadow-soft' 
                        : 'text-neutral-600 hover:text-primary-500'
                      }
                    `}
                  >
                    {isFirst && (
                      <Home className={`
                        w-4 h-4 mr-1.5 transition-colors duration-300
                        ${isHovered ? 'text-primary-500' : 'text-neutral-400'}
                      `} />
                    )}
                    <span className={`
                      font-bangla truncate max-w-[150px] sm:max-w-[200px] transition-all duration-300
                      ${isHovered ? 'font-medium' : ''}
                    `}>
                      {item.name}
                    </span>
                    
                    {/* Hover indicator */}
                    <span className={`
                      ml-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 transition-all duration-300
                      ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                    `} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default CategoryBreadcrumb;