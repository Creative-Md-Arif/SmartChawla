import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Plus, Edit2, Trash2 } from 'lucide-react';

const CategoryTree = ({
  categories,
  onSelect,
  onEdit,
  onDelete,
  onAddSubcategory,
  onReorder,
  selectedId,
  isAdmin = false,
}) => {
  const [expandedIds, setExpandedIds] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      onReorder?.(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const renderCategory = (category, depth = 0) => {
    const isExpanded = expandedIds.includes(category._id);
    const isSelected = selectedId === category._id;
    const isDragOver = dragOverId === category._id;
    const hasChildren = category.subCategories?.length > 0;

    return (
      <div key={category._id}>
        <div
          draggable={isAdmin}
          onDragStart={(e) => handleDragStart(e, category._id)}
          onDragOver={(e) => handleDragOver(e, category._id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category._id)}
          className={`
            flex items-center py-2 px-3 rounded-lg cursor-pointer
            transition-colors duration-200
            ${isSelected  'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}
            ${isDragOver  'border-2 border-purple-400 border-dashed' : ''}
            ${depth > 0  'ml-6' : ''}
          `}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(category._id);
            }}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600"
          >
            {hasChildren  (
              isExpanded  (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          {/* Folder Icon */}
          <div className="mr-2 text-gray-400">
            {isExpanded  (
              <FolderOpen className="w-5 h-5" />
            ) : (
              <Folder className="w-5 h-5" />
            )}
          </div>

          {/* Category Name */}
          <span
            onClick={() => onSelect?.(category)}
            className="flex-1 font-medium truncate"
          >
            {category.name?.bn || category.name?.en || 'Untitled'}
          </span>

          {/* Product Count */}
          <span className="text-xs text-gray-400 mr-4">
            {category.productCount || 0}
          </span>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubcategory?.(category);
                }}
                className="p-1 text-gray-400 hover:text-purple-600"
                title="Add Subcategory"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(category);
                }}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(category);
                }}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {category.subCategories?.map((sub) =>
              renderCategory(sub, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
      <div className="space-y-1">
        {categories?.map((category) => renderCategory(category))}
      </div>
    </div>
  );
};

export default CategoryTree;
