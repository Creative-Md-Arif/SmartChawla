import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Grid3X3,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

const CategoryDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const { categories = [] } = useCategories();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setExpandedIds([]);
      setHoveredId(null);
      setActiveCategory(null);
    }, 250);
  };

  const handleCategoryHover = (categoryId, hasChildren) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(categoryId);
      setActiveCategory(categoryId);
      if (hasChildren && !expandedIds.includes(categoryId)) {
        setExpandedIds((prev) => [...prev, categoryId]);
      }
    }, 150);
  };

  const toggleExpand = (e, categoryId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedIds((prev) => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getCategoryColor = (index) => {
    const colors = [
      'from-primary-400 to-primary-600',
      'from-secondary-400 to-secondary-600', 
      'from-accent to-amber-500',
      'from-rose-400 to-rose-600',
      'from-cyan-400 to-cyan-600',
      'from-violet-400 to-violet-600',
    ];
    return colors[index % colors.length];
  };

  const renderCategory = (category, depth = 0, index = 0) => {
    const isExpanded = expandedIds.includes(category._id);
    const isSelected = selectedId === category._id;
    const isHovered = hoveredId === category._id;
    const hasChildren = category.subCategories && category.subCategories.length > 0;
    const isActive = activeCategory === category._id;

    return (
      <div key={category._id} className="w-full group/category">
        <div
          className={`
            flex items-center py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-300 ease-out
            ${isSelected 
              ? 'bg-primary-100 text-primary-700 shadow-soft' 
              : isActive || isHovered
                ? 'bg-primary-50/80 text-primary-600'
                : 'hover:bg-neutral-50 text-neutral-700'
            }
            ${depth === 0 ? 'mb-1' : 'mb-0.5'}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onMouseEnter={() => handleCategoryHover(category._id, hasChildren)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(e, category._id)}
              className={`
                p-1 mr-1.5 rounded-md transition-all duration-200
                ${isExpanded 
                  ? 'bg-primary-200 text-primary-700 rotate-0' 
                  : 'bg-neutral-100 text-neutral-400 hover:bg-primary-100 hover:text-primary-600'
                }
              `}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-1.5" /> // Spacer
          )}

          {/* Folder Icon with Gradient */}
          <div className={`
            mr-3 p-1.5 rounded-lg transition-all duration-300
            ${isSelected || isExpanded
              ? `bg-gradient-to-br ${getCategoryColor(index)} shadow-md`
              : 'bg-neutral-100 text-neutral-400 group-hover/category:bg-primary-100 group-hover/category:text-primary-500'
            }
          `}>
            {isExpanded ? (
              <FolderOpen className={`w-4 h-4 ${isSelected || isExpanded ? 'text-white' : ''}`} />
            ) : (
              <Folder className={`w-4 h-4 ${isSelected || isExpanded ? 'text-white' : ''}`} />
            )}
          </div>

          {/* Category Name */}
          <Link
            to={`/category/${category.slug}`}
            onClick={() => {
              setSelectedId(category._id);
              setIsOpen(false);
            }}
            className={`
              flex-1 font-medium truncate text-sm transition-colors duration-200 font-bangla
              ${isSelected ? 'text-primary-700' : 'text-neutral-700 group-hover/category:text-primary-600'}
            `}
          >
            {category.name?.bn || category.name?.en}
          </Link>

          {/* Item Count or Arrow */}
          {category.productCount > 0 && (
            <span className={`
              ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-200
              ${isSelected || isHovered
                ? 'bg-primary-200 text-primary-700'
                : 'bg-neutral-100 text-neutral-500'
              }
            `}>
              {category.productCount}
            </span>
          )}
          
          {/* Hover Arrow */}
          <ArrowRight className={`
            w-4 h-4 ml-2 transition-all duration-300
            ${isHovered ? 'opacity-100 translate-x-0 text-primary-500' : 'opacity-0 -translate-x-2'}
          `} />
        </div>

        {/* Animated Sub-Categories */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          {hasChildren && (
            <div className="mt-1 relative">
              {/* Connector Line */}
              <div className="absolute left-[22px] top-0 bottom-4 w-px bg-gradient-to-b from-primary-200 to-transparent" />
              
              {category.subCategories.map((sub, subIndex) => {
                const fullSubData = categories.find(c => c._id === sub._id) || sub;
                return renderCategory(fullSubData, depth + 1, subIndex);
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter root categories
  const rootCategories = categories.filter(cat => cat.parentCategory === null);

  return (
    <div 
      ref={dropdownRef} 
      className="relative inline-block text-left"
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        onMouseEnter={handleMouseEnter}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300
          ${isOpen 
            ? 'bg-primary-100 text-primary-700 shadow-soft' 
            : 'text-neutral-800 hover:text-primary-600 hover:bg-primary-50/50'
          }
        `}
      >
        <div className={`
          p-1.5 rounded-lg mr-2 transition-all duration-300
          ${isOpen 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-neutral-100 text-neutral-500 group-hover:bg-primary-100 group-hover:text-primary-500'
          }
        `}>
          <Grid3X3 className="w-4 h-4" />
        </div>
        <span className="font-bangla text-sm">ক্যাটাগরি</span>
        <ChevronDown className={`
          w-4 h-4 ml-2 transition-transform duration-300
          ${isOpen ? 'rotate-180 text-primary-500' : 'text-neutral-400'}
        `} />
        
        {/* Active Indicator Dot */}
        <span className={`
          ml-2 w-1.5 h-1.5 rounded-full bg-secondary-500 transition-all duration-300
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `} />
      </button>

      {/* Enhanced Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-[300px] bg-white shadow-premium border border-primary-100 rounded-2xl overflow-hidden z-50 animate-slide-up"
          onMouseEnter={handleMouseEnter}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-50 via-white to-primary-50 border-b border-primary-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider font-bangla">
                  সব ক্যাটাগরি
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {categories.length}টি
              </span>
            </div>
          </div>
          
          {/* Categories List */}
          <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-transparent">
            {rootCategories.length > 0 ? (
              <div className="space-y-1">
                {rootCategories.map((cat, index) => renderCategory(cat, 0, index))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Folder className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-neutral-400 text-sm font-bangla">কোনো ক্যাটাগরি নেই</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-neutral-100 bg-neutral-50/50">
            <Link
              to="/categories"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 group"
            >
              <span className="font-bangla">সব ক্যাটাগরি দেখুন</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;