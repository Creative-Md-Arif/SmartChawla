import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

const CategorySidebar = ({ selectedCategories = [], onCategoryChange }) => {
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { categories = [] } = useCategories(); 

  const toggleExpand = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (categoryId) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoryChange?.(newSelected);
  };

  const clearFilters = () => {
    onCategoryChange?.([]);
  };

  const renderCategory = (category, depth = 0) => {
    // শুধুমাত্র মেইন অ্যারে থেকে ক্যাটাগরি খুঁজে বের করা যাতে ডাটা কনসিস্টেন্ট থাকে
    const fullCategoryData = categories.find(c => c._id === category._id) || category;
    
    const isExpanded = expandedCategories.includes(fullCategoryData._id);
    const isSelected = selectedCategories.includes(fullCategoryData._id);
    const hasSubCategories = fullCategoryData.subCategories && fullCategoryData.subCategories.length > 0;

    return (
      <div key={fullCategoryData._id} className="w-full">
        <div className="flex items-center group">
          {hasSubCategories ? (
            <button
              onClick={() => toggleExpand(fullCategoryData._id)}
              className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-6" /> 
          )}

          <label className={`flex items-center flex-1 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-2 transition-all ${isSelected ? 'bg-purple-50' : ''}`}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCategoryClick(fullCategoryData._id)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
            />
            <span className={`ml-2 text-sm ${isSelected ? 'text-purple-700 font-medium' : 'text-gray-700'}`}>
              {fullCategoryData.name?.bn || fullCategoryData.name?.en}
            </span>
          </label>
        </div>

        {/* সাব-ক্যাটাগরি রেন্ডারিং */}
        {isExpanded && hasSubCategories && (
          <div className="ml-4 border-l border-gray-100 mt-1">
            {fullCategoryData.subCategories.map((sub) => 
              renderCategory(sub, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // ফিল্টার: শুধুমাত্র Root Categories (যাদের parentCategory null)
  const rootCategories = categories.filter(cat => cat.parentCategory === null);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden w-full mb-4 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl flex items-center justify-between shadow-sm active:scale-95 transition-transform"
      >
        <span className="font-medium">Filter by Category</span>
        <div className="flex items-center gap-2">
          {selectedCategories.length > 0 && (
            <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {selectedCategories.length}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out lg:transform-none shadow-2xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between lg:hidden">
          <h2 className="font-bold text-gray-900">Filters</h2>
          <button onClick={() => setIsMobileOpen(false)} className="p-2 bg-gray-50 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Categories</h3>
            {selectedCategories.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {rootCategories.length > 0 ? (
              rootCategories.map((category) => renderCategory(category))
            ) : (
              <p className="text-gray-400 text-sm text-center py-10">No categories found</p>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="mt-auto pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((catId) => {
                  const category = categories.find((c) => c._id === catId);
                  return (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg"
                    >
                      {category?.name?.bn || category?.name?.en}
                      <button onClick={() => handleCategoryClick(catId)} className="hover:bg-purple-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CategorySidebar;