import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, X, Save, Loader2, Image as ImageIcon, 
  ChevronDown, ChevronUp, Folder, FolderOpen 
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory,
  fetchCategoryTree 
} from '../../redux/slices/categorySlice'; 
import CategoryTree from '../../components/category/CategoryTree';

const ManageCategories = () => {
  const dispatch = useDispatch();
  const { treeStructure: categories, loading } = useSelector((state) => state.category);
  
  // UI States
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'seo' | 'media'
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    seo: false,
    media: false
  });

  // Image States
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);

  // Form Errors
  const [errors, setErrors] = useState({});

  // ==================== DYNAMIC FORM INITIAL STATE ====================
  const getInitialFormState = useCallback(() => ({
    // Required Fields (name object)
    'name[bn]': '',
    'name[en]': '',
    
    // Auto-generated
    slug: '',
    
    // Optional Fields
    'description[bn]': '',
    'description[en]': '',
    parentCategory: '',
    type: 'product',
    icon: '',
    isActive: true,
    displayOrder: 0,
    
    // SEO Fields
    metaTitle: '',
    metaDescription: '',
    
    // Image URLs (for display/editing)
    featuredImage: { public_id: '', url: '' },
    bannerImage: { public_id: '', url: '' },
    
    // Counts (read-only)
    productCount: 0,
    courseCount: 0,
  }), []);

  const [formData, setFormData] = useState(getInitialFormState());

  // ==================== UTILITY FUNCTIONS ====================
  
  // Generate slug from English name
  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-') // Allow Bengali chars too
      .replace(/^-+|-+$/g, '');
  };

  // Flatten categories for parent dropdown (exclude self and descendants)
  const flattenCategories = (cats, excludeId = null, depth = 0) => {
    const result = [];
    
    cats?.forEach((cat) => {
      if (cat._id !== excludeId) {
        result.push({
          _id: cat._id,
          name: cat.name?.en || cat.name?.bn || 'Unnamed',
          depth,
          hasChildren: cat.subCategories?.length > 0
        });
        
        if (cat.subCategories?.length) {
          result.push(...flattenCategories(cat.subCategories, excludeId, depth + 1));
        }
      }
    });
    
    return result;
  };

  // Get all descendant IDs (to prevent circular reference)
  const getDescendantIds = (category) => {
    const ids = [];
    const traverse = (cats) => {
      cats?.forEach((cat) => {
        ids.push(cat._id);
        if (cat.subCategories?.length) {
          traverse(cat.subCategories);
        }
      });
    };
    
    if (category?.subCategories) {
      traverse(category.subCategories);
    }
    
    return ids;
  };

  // ==================== FORM HANDLERS ====================

  const resetForm = () => {
    setFormData(getInitialFormState());
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setErrors({});
    setActiveTab('basic');
    setExpandedSections({ basic: true, seo: false, media: false });
  };

  const handleAdd = (parentId = null) => {
    resetForm();
    if (parentId) {
      setFormData((prev) => ({ ...prev, parentCategory: parentId }));
    }
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    
    // Map backend data to form fields dynamically
    setFormData({
      'name[bn]': category.name?.bn || '',
      'name[en]': category.name?.en || '',
      slug: category.slug || '',
      'description[bn]': category.description?.bn || '',
      'description[en]': category.description?.en || '',
      parentCategory: category.parentCategory?._id || category.parentCategory || '',
      type: category.type || 'product',
      icon: category.icon || '',
      isActive: category.isActive ?? true,
      displayOrder: category.displayOrder || 0,
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
      featuredImage: category.featuredImage || { public_id: '', url: '' },
      bannerImage: category.bannerImage || { public_id: '', url: '' },
      productCount: category.productCount || 0,
      courseCount: category.courseCount || 0,
    });

    // Set image previews
    setFeaturedImagePreview(category.featuredImage?.url || null);
    setBannerImagePreview(category.bannerImage?.url || null);
    setFeaturedImageFile(null);
    setBannerImageFile(null);
    
    setShowModal(true);
  };

  // Dynamic field handler - handles both flat and nested fields
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug when English name changes (only for new categories)
    if (field === 'name[en]' && !editingCategory) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        slug: generateSlug(value),
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle nested object fields (name, description)
  const handleNestedChange = (parentField, lang, value) => {
    const fieldKey = `${parentField}[${lang}]`;
    handleChange(fieldKey, value);
  };

  // Image handlers
  const handleImageChange = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'featured') {
      setFeaturedImageFile(file);
      setFeaturedImagePreview(URL.createObjectURL(file));
    } else if (type === 'banner') {
      setBannerImageFile(file);
      setBannerImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = (type) => {
    if (type === 'featured') {
      setFeaturedImageFile(null);
      setFeaturedImagePreview(null);
      setFormData((prev) => ({
        ...prev,
        featuredImage: { public_id: '', url: '' },
      }));
    } else if (type === 'banner') {
      setBannerImageFile(null);
      setBannerImagePreview(null);
      setFormData((prev) => ({
        ...prev,
        bannerImage: { public_id: '', url: '' },
      }));
    }
  };

  // ==================== VALIDATION ====================

  const validateForm = () => {
    const newErrors = {};

    // Required fields from Model
    if (!formData['name[bn]']?.trim()) {
      newErrors['name[bn]'] = 'Bengali name is required';
    }
    if (!formData['name[en]']?.trim()) {
      newErrors['name[en]'] = 'English name is required';
    }
    if (!formData.slug?.trim()) {
      newErrors.slug = 'Slug is required';
    }

    // Type validation
    const validTypes = ['product', 'course', 'both'];
    if (!validTypes.includes(formData.type)) {
      newErrors.type = 'Invalid type selected';
    }

    // Meta fields length validation
    if (formData.metaTitle?.length > 70) {
      newErrors.metaTitle = 'Meta title must be 70 characters or less';
    }
    if (formData.metaDescription?.length > 160) {
      newErrors.metaDescription = 'Meta description must be 160 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==================== SUBMIT HANDLER ====================

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setSubmitting(true);
  try {
    // Prepare FormData for multipart submission
    const submitData = new FormData();

    // Append all form fields dynamically
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      
      // Skip null/undefined values
      if (value === null || value === undefined) return;
      
      // 🔴 FIX: Convert empty string to null for parentCategory
      if (key === 'parentCategory' && value === '') {
        // Skip appending empty parentCategory - backend will get undefined -> null
        return;
      }
      
      // 🔴 FIX: Handle nested objects (featuredImage, bannerImage)
      if (typeof value === 'object' && !(value instanceof File)) {
        // Only send if has public_id (existing image)
        if (value?.public_id) {
          submitData.append(`${key}[public_id]`, value.public_id);
          submitData.append(`${key}[url]`, value.url);
        }
      } 
      // Handle arrays
      else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          submitData.append(`${key}[${index}]`, item);
        });
      }
      // Handle primitives
      else {
        submitData.append(key, value);
      }
    });

    // Append image files if selected
    if (featuredImageFile) {
      submitData.append('image', featuredImageFile);
    }
    if (bannerImageFile) {
      submitData.append('bannerImage', bannerImageFile);
    }

    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log('Submitting FormData:');
      for (let [key, val] of submitData.entries()) {
        console.log(`${key}:`, val);
      }
    }

    if (editingCategory) {
      await dispatch(updateCategory({ 
        id: editingCategory._id, 
        data: submitData,
        isFormData: true
      })).unwrap();
    } else {
      await dispatch(createCategory({ 
        data: submitData,
        isFormData: true
      })).unwrap();
    }

    setShowModal(false);
    resetForm();
    dispatch(fetchCategoryTree());
  } catch (error) {
    console.error('Submit error:', error);
    setErrors((prev) => ({
      ...prev,
      submit: error || 'Failed to save category',
    }));
  } finally {
    setSubmitting(false);
  }
};

  // ==================== DELETE HANDLER ====================

  const handleDelete = async (category) => {
    // Check if has subcategories (from backend check)
    if (category.subCategories?.length > 0) {
      alert(`Cannot delete "${category.name?.en}". Please delete subcategories first.`);
      return;
    }

    if (!confirm(`Delete "${category.name?.en || category.name?.bn}"?`)) return;

    try {
      await dispatch(deleteCategory(category._id)).unwrap();
      dispatch(fetchCategoryTree());
    } catch (error) {
      alert(error || 'Failed to delete category');
    }
  };

  // ==================== REORDER HANDLER ====================

  const handleReorder = async (draggedId, targetId) => {
    // Implement reorder logic via API
    try {
      // Find categories and update displayOrder
      const flattened = flattenCategories(categories);
      const draggedCat = flattened.find(c => c._id === draggedId);
      const targetCat = flattened.find(c => c._id === targetId);
      
      if (!draggedCat || !targetCat) return;

      // You might want to call a reorder API here
      console.log('Reordering:', draggedCat.name, 'to', targetCat.name);
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  // ==================== LIFECYCLE ====================

  useEffect(() => {
    dispatch(fetchCategoryTree());
  }, [dispatch]);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      if (featuredImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(featuredImagePreview);
      }
      if (bannerImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(bannerImagePreview);
      }
    };
  }, [featuredImagePreview, bannerImagePreview]);

  // ==================== RENDER HELPERS ====================

  const renderField = (label, name, type = 'text', options = {}) => {
    const { placeholder, required, maxLength, rows, min, max } = options;
    const value = formData[name] || '';
    const error = errors[name];

    const baseClassName = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClassName}
            rows={rows || 3}
            maxLength={maxLength}
            placeholder={placeholder}
          />
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClassName}
          >
            {options.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(name, parseInt(e.target.value) || 0)}
            className={baseClassName}
            min={min}
            max={max}
            placeholder={placeholder}
          />
        ) : type === 'checkbox' ? (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(name, e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-600">{placeholder}</span>
          </div>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClassName}
            maxLength={maxLength}
            placeholder={placeholder}
            readOnly={options.readOnly}
          />
        )}
        
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {maxLength && (
          <p className="mt-1 text-xs text-gray-400">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    );
  };

  const renderSection = (title,  Icon, isExpanded, onToggle, children) => (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );

  // ==================== MAIN RENDER ====================

  if (loading && !categories.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const availableParents = flattenCategories(
    categories, 
    editingCategory?._id
  ).filter((cat) => {
    // Prevent selecting self or descendants as parent
    if (!editingCategory) return true;
    const descendantIds = getDescendantIds(editingCategory);
    return !descendantIds.includes(cat._id);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize products and courses with hierarchical categories
          </p>
        </div>
        <button
          onClick={() => handleAdd()}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Category Tree */}
      <CategoryTree
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddSubcategory={(parentId) => handleAdd(parentId)}
        onReorder={handleReorder}
        isAdmin={true}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                {editingCategory && (
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {editingCategory._id}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Global Error */}
              {errors.submit && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {errors.submit}
                </div>
              )}

              {/* Basic Information Section */}
              {renderSection(
                'Basic Information',
                Folder,
                expandedSections.basic,
                () => setExpandedSections(p => ({ ...p, basic: !p.basic })),
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bengali Name */}
                    {renderField('Name (Bengali)', 'name[bn]', 'text', {
                      placeholder: 'বাংলা নাম',
                      required: true,
                    })}

                    {/* English Name */}
                    {renderField('Name (English)', 'name[en]', 'text', {
                      placeholder: 'English name',
                      required: true,
                    })}
                  </div>

                  {/* Slug */}
                  {renderField('Slug', 'slug', 'text', {
                    placeholder: 'auto-generated-from-english-name',
                    required: true,
                    readOnly: !editingCategory, // Auto-generated for new
                  })}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    {renderField('Type', 'type', 'select', {
                      options: [
                        { value: 'product', label: 'Product' },
                        { value: 'course', label: 'Course' },
                        { value: 'both', label: 'Both' },
                      ],
                    })}

                    {/* Parent Category */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Category
                      </label>
                      <select
                        value={formData.parentCategory}
                        onChange={(e) => handleChange('parentCategory', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">None (Top Level)</option>
                        {availableParents.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {'  '.repeat(cat.depth)} {cat.depth > 0 ? '└─ ' : ''}
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Description (Bengali)', 'description[bn]', 'textarea', {
                      placeholder: 'বাংলা বিবরণ',
                      rows: 2,
                    })}
                    {renderField('Description (English)', 'description[en]', 'textarea', {
                      placeholder: 'English description',
                      rows: 2,
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Icon */}
                    {renderField('Icon', 'icon', 'text', {
                      placeholder: 'e.g., Smartphone, BookOpen',
                    })}

                    {/* Display Order */}
                    {renderField('Display Order', 'displayOrder', 'number', {
                      min: 0,
                      placeholder: '0 = first',
                    })}

                    {/* Active Status */}
                    <div className="flex items-end pb-2">
                      {renderField('Active', 'isActive', 'checkbox', {
                        placeholder: 'Visible to users',
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* SEO Section */}
              {renderSection(
                'SEO Settings',
                FolderOpen,
                expandedSections.seo,
                () => setExpandedSections(p => ({ ...p, seo: !p.seo })),
                <>
                  {renderField('Meta Title', 'metaTitle', 'text', {
                    placeholder: 'SEO Title (max 70 chars)',
                    maxLength: 70,
                  })}
                  {renderField('Meta Description', 'metaDescription', 'textarea', {
                    placeholder: 'SEO Description (max 160 chars)',
                    maxLength: 160,
                    rows: 2,
                  })}
                </>
              )}

              {/* Media Section */}
              {renderSection(
                'Images',
                ImageIcon,
                expandedSections.media,
                () => setExpandedSections(p => ({ ...p, media: !p.media })),
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Featured Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Featured Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                        {featuredImagePreview ? (
                          <div className="relative">
                            <img
                              src={featuredImagePreview}
                              alt="Featured"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage('featured')}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange('featured', e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Banner Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                        {bannerImagePreview ? (
                          <div className="relative">
                            <img
                              src={bannerImagePreview}
                              alt="Banner"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage('banner')}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange('banner', e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Stats (Read-only for edit mode) */}
              {editingCategory && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">
                      Products: <strong className="text-purple-600">{formData.productCount}</strong>
                    </span>
                    <span className="text-gray-600">
                      Courses: <strong className="text-purple-600">{formData.courseCount}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;