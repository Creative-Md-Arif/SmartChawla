import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Sparkles } from 'lucide-react';
import { useState } from 'react';

const CategoryBreadcrumb = ({ items = [] }) => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const breadcrumbItems = [
    { name: 'হোম', url: '/' },
    ...items,
  ];

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
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      <nav 
        aria-label="Breadcrumb" 
        className="py-2.5 sm:py-4 bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2 sm:px-4 mb-4 sm:mb-6 border border-neutral-100/50"
      >
        {/* overflow-x-auto handles small screens without breaking layout */}
        <ol className="flex items-center whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth py-1">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isFirst = index === 0;
            const isHovered = hoveredIndex === index;

            return (
              <li 
                key={index} 
                className="flex items-center flex-shrink-0"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Separator - Slightly smaller for mobile */}
                {index > 0 && (
                  <ChevronRight className={`
                    w-3.5 h-3.5 sm:w-4 sm:h-4 mx-1 sm:mx-2 transition-all duration-300 flex-shrink-0
                    ${isHovered ? 'text-purple-400 translate-x-0.5' : 'text-neutral-300'}
                  `} />
                )}

                {/* Breadcrumb Item */}
                {isLast ? (
                  <span
                    className={`
                      flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold transition-all duration-300 text-[11px] sm:text-sm
                      bg-purple-50 text-purple-700 border border-purple-200 shadow-sm
                    `}
                    aria-current="page"
                  >
                    {isFirst && (
                      <Home className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-purple-500 flex-shrink-0" />
                    )}
                    <span className="font-bangla truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs">
                      {item.name}
                    </span>
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1 sm:ml-1.5 text-purple-400 animate-pulse flex-shrink-0" />
                  </span>
                ) : (
                  <Link
                    to={item.url}
                    className={`
                      flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-300 text-[11px] sm:text-sm
                      ${isHovered 
                        ? 'bg-purple-50 text-purple-600' 
                        : 'text-neutral-500 hover:text-purple-500'
                      }
                    `}
                  >
                    {isFirst && (
                      <Home className={`
                        w-3.5 h-3.5 mr-1 sm:mr-1.5 transition-colors duration-300 flex-shrink-0
                        ${isHovered ? 'text-purple-500' : 'text-neutral-400'}
                      `} />
                    )}
                    <span className={`
                      font-bangla truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]
                      ${isHovered ? 'font-bold' : 'font-medium'}
                    `}>
                      {item.name}
                    </span>
                    
                    {/* Hover indicator - Hidden on very small screens to save space */}
                    <span className={`
                      hidden sm:block ml-1.5 w-1 h-1 rounded-full bg-purple-400 transition-all duration-300
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