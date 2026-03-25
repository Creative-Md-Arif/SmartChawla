import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

const CategoryTreeNode = ({ 
  category, 
  depth = 0, 
  isExpanded, 
  onToggle, 
  activePath, 
  onHover 
}) => {
  const hasChildren = category.subCategories?.length > 0;
  const isActive = activePath.includes(category._id);
  const nodeRef = useRef(null);

  return (
    <div className="relative" ref={nodeRef}>
      {/* Node Header */}
      <div
        className={`
          group flex items-center justify-between px-4 py-2.5 cursor-pointer
          transition-all duration-200 ease-in-out
          ${depth > 0 ? 'pl-8' : ''}
          ${isActive 
            ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600' 
            : 'hover:bg-gray-50 text-gray-700 hover:text-purple-600'
          }
        `}
        onClick={() => hasChildren && onToggle(category._id)}
        onMouseEnter={() => onHover(category._id)}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(category._id);
              }}
              className={`
                p-1 rounded-md transition-transform duration-200
                ${isExpanded ? 'rotate-90' : 'rotate-0'}
                hover:bg-purple-100
              `}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="w-6" /> // Spacer for alignment
          )}

          {/* Category Icon */}
          {category.icon ? (
            <img
              src={category.icon}
              alt=""
              className="w-5 h-5 object-contain"
            />
          ) : (
            <Folder className={`
              w-5 h-5 transition-colors duration-200
              ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'}
            `} />
          )}

          {/* Category Name */}
          <Link
            to={`/category/${category.slug}`}
            className="flex-1 text-sm font-medium truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {category.name.bn || category.name.en}
          </Link>
        </div>

        {/* Item Count Badge */}
        {category.itemCount > 0 && (
          <span className={`
            text-xs px-2 py-0.5 rounded-full
            ${isActive 
              ? 'bg-purple-200 text-purple-800' 
              : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700'
            }
          `}>
            {category.itemCount}
          </span>
        )}
      </div>

      {/* Children Container with Animation */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="relative">
          {/* Vertical Line Connector */}
          {depth < 2 && (
            <div className="absolute left-7 top-0 bottom-0 w-px bg-gray-200" />
          )}
          
          {category.subCategories?.map((sub) => (
            <CategoryTreeNode
              key={sub._id}
              category={sub}
              depth={depth + 1}
              isExpanded={activePath.includes(sub._id)}
              onToggle={onToggle}
              activePath={activePath}
              onHover={onHover}
            />
          ))}
          
          {/* View All Link at bottom of expanded section */}
          {depth === 0 && (
            <div className={`
              pl-12 pr-4 py-2 border-t border-gray-100 mt-1
              ${isExpanded ? 'block' : 'hidden'}
            `}>
              <Link
                to={`/category/${category.slug}`}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                View All in fffff {category.name.bn || category.name.en}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CategoryNav = () => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'mega'
  const { categories, loading } = useCategories();
  const containerRef = useRef(null);

  // Auto-expand on hover delay
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleToggle = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleHover = (nodeId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNode(nodeId);
    }, 150);
  };

  const expandAll = () => {
    const allIds = new Set();
    const collectIds = (cats) => {
      cats.forEach(cat => {
        allIds.add(cat._id);
        if (cat.subCategories) collectIds(cat.subCategories);
      });
    };
    collectIds(categories);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Filter categories based on search
  const filteredCategories = searchQuery
    ? categories.filter(cat => 
        (cat.name.bn || cat.name.en).toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subCategories?.some(sub => 
          (sub.name.bn || sub.name.en).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : categories;

  // Build active path for highlighting
  const getActivePath = () => {
    const path = [];
    const findPath = (cats, targetId) => {
      for (const cat of cats) {
        if (cat._id === targetId || hoveredNode === cat._id) {
          path.push(cat._id);
          return true;
        }
        if (cat.subCategories) {
          if (findPath(cat.subCategories, targetId)) {
            path.push(cat._id);
            return true;
          }
        }
      }
      return false;
    };
    findPath(categories, hoveredNode);
    return path;
  };

  const activePath = getActivePath();

  if (loading) {
    return (
      <div className="w-64 h-screen bg-gray-100 animate-pulse">
        <div className="h-12 bg-gray-200 mb-4" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 mx-4 my-2 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" ref={containerRef}>
      {/* Header Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h2 className="text-lg font-bold text-gray-900">Categories</h2>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'tree' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tree
                </button>
                <button
                  onClick={() => setViewMode('mega')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'mega' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mega
                </button>
              </div>

              {/* Expand/Collapse Controls */}
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'tree' ? (
          /* Tree View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Tree */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Browse Categories</h3>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredCategories.map((category) => (
                    <CategoryTreeNode
                      key={category._id}
                      category={category}
                      isExpanded={expandedNodes.has(category._id)}
                      onToggle={handleToggle}
                      activePath={activePath}
                      onHover={handleHover}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
                {hoveredNode ? (
                  <div className="animate-fadeIn">
                    {(() => {
                      const findCategory = (cats, id) => {
                        for (const cat of cats) {
                          if (cat._id === id) return cat;
                          if (cat.subCategories) {
                            const found = findCategory(cat.subCategories, id);
                            if (found) return found;
                          }
                        }
                        return null;
                      };
                      const activeCat = findCategory(categories, hoveredNode);
                      
                      return activeCat ? (
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                            {activeCat.icon && (
                              <img src={activeCat.icon} alt="" className="w-16 h-16 object-contain" />
                            )}
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">
                                {activeCat.name.bn || activeCat.name.en}
                              </h2>
                              <p className="text-gray-500 mt-1">
                                {activeCat.subCategories?.length || 0} subcategories • {activeCat.itemCount || 0} items
                              </p>
                            </div>
                          </div>
                          
                          {activeCat.subCategories?.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {activeCat.subCategories.map(sub => (
                                <Link
                                  key={sub._id}
                                  to={`/category/${sub.slug}`}
                                  className="group p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex items-center gap-3">
                                    {sub.icon ? (
                                      <img src={sub.icon} alt="" className="w-8 h-8 object-contain" />
                                    ) : (
                                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Folder className="w-4 h-4 text-purple-600" />
                                      </div>
                                    )}
                                    <span className="font-medium text-gray-900 group-hover:text-purple-600">
                                      {sub.name.bn || sub.name.en}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                          
                          <Link
                            to={`/category/${activeCat.slug}`}
                            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            View All Items vvcc
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FolderOpen className="w-16 h-16 mb-4" />
                    <p className="text-lg">Hover over a category to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Mega Menu View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
              {filteredCategories.map((category) => (
                <div key={category._id} className="group">
                  <Link
                    to={`/category/${category.slug}`}
                    className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 group-hover:border-purple-200 transition-colors"
                  >
                    {category.icon && (
                      <img src={category.icon} alt="" className="w-8 h-8 object-contain" />
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {category.name.bn || category.name.en}
                    </h3>
                  </Link>
                  
                  <ul className="space-y-2">
                    {category.subCategories?.slice(0, 5).map((sub) => (
                      <li key={sub._id}>
                        <Link
                          to={`/category/${sub.slug}`}
                          className="text-sm text-gray-600 hover:text-purple-600 hover:translate-x-1 inline-block transition-all duration-200"
                        >
                          {sub.name.bn || sub.name.en}
                        </Link>
                      </li>
                    ))}
                    {category.subCategories?.length > 5 && (
                      <li>
                        <Link
                          to={`/category/${category.slug}`}
                          className="text-sm text-purple-600 font-medium hover:underline"
                        >
                          +{category.subCategories.length - 5} more
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet (for small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <button
          onClick={() => setViewMode(viewMode === 'tree' ? 'mega' : 'tree')}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium"
        >
          Switch to {viewMode === 'tree' ? 'Grid View' : 'Tree View'}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CategoryNav;