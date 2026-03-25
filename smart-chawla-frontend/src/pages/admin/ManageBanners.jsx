import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BarChart3, Calendar, X, Upload, Filter, RefreshCw } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import AdminSidebar from "../../pages/admin/AdminSidebar"; 

const ManageBanners = () => {

  
  // Banner List State
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Form State - All Model Parameters
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    subtitle: '',
    link: '',
    buttonText: 'Shop Now',
    
    // Position & Priority
    position: 'hero',
    priority: 0,
    
    // Status & Dates
    status: 'active',
    startDate: '',
    endDate: '',
    
    // Colors
    backgroundColor: '#ffffff',
    textColor: '#ffffff',
    
    // Display Conditions (displayConditions object)
    showOnHome: true,
    showOnShop: false,
    showOnCourse: false,
    showOnProductDetail: false,
    
    // Target Audience (targetAudience object)
    targetAll: true,
    targetNewUsers: false,
    targetReturningUsers: false,
    specificCategories: [],
  });
  
  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [mobileImageFile, setMobileImageFile] = useState(null);
  const [mobileImagePreview, setMobileImagePreview] = useState('');
  
  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // 🔴 ADDED: Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ==================== CONSTANTS ====================
  
  // Position Enum from Model
  const positions = ['hero', 'promo', 'sidebar', 'popup', 'footer', 'category'];
  
  // Status Enum from Model
  const statuses = ['active', 'inactive'];

  // ==================== LIFECYCLE ====================
  
  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, [filterPosition, filterStatus]);

  // ==================== API CALLS ====================
  
  // Fetch All Banners (with filters)
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterPosition) params.position = filterPosition;
      if (filterStatus) params.status = filterStatus;
      
      const response = await axiosInstance.get('/banners', { params });
      setBanners(response.data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Categories for Target Audience
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories');
      setAvailableCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Delete Banner
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await axiosInstance.delete(`/banners/${id}`);
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  // View Analytics
  const handleViewAnalytics = async (banner) => {
    try {
      const response = await axiosInstance.get(`/banners/${banner._id}/analytics`);
      setAnalyticsData(response.data.analytics);
      setSelectedBanner(banner);
      setShowAnalyticsModal(true);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // ==================== FORM HANDLERS ====================
  
  // Reset Form to Default
  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      link: '',
      buttonText: 'Shop Now',
      position: 'hero',
      priority: 0,
      status: 'active',
      startDate: '',
      endDate: '',
      backgroundColor: '#ffffff',
      textColor: '#ffffff',
      showOnHome: true,
      showOnShop: false,
      showOnCourse: false,
      showOnProductDetail: false,
      targetAll: true,
      targetNewUsers: false,
      targetReturningUsers: false,
      specificCategories: [],
    });
    setImageFile(null);
    setImagePreview('');
    setMobileImageFile(null);
    setMobileImagePreview('');
  };

  // Open Add Modal
  const handleAddNew = () => {
    setSelectedBanner(null);
    resetForm();
    setShowModal(true);
  };

  // Open Edit Modal with Data
  const handleEdit = (banner) => {
    setSelectedBanner(banner);
    
    // Populate all form fields from banner data
    setFormData({
      // Basic Info
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      buttonText: banner.buttonText || 'Shop Now',
      
      // Position & Priority
      position: banner.position || 'hero',
      priority: banner.priority || 0,
      
      // Status & Dates
      status: banner.status || 'active',
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      
      // Colors
      backgroundColor: banner.backgroundColor || '#ffffff',
      textColor: banner.textColor || '#ffffff',
      
      // Display Conditions
      showOnHome: banner.displayConditions?.showOnHome ?? true,
      showOnShop: banner.displayConditions?.showOnShop || false,
      showOnCourse: banner.displayConditions?.showOnCourse || false,
      showOnProductDetail: banner.displayConditions?.showOnProductDetail || false,
      
      // Target Audience
      targetAll: banner.targetAudience?.all ?? true,
      targetNewUsers: banner.targetAudience?.newUsers || false,
      targetReturningUsers: banner.targetAudience?.returningUsers || false,
      specificCategories: banner.targetAudience?.specificCategories?.map(cat => 
        typeof cat === 'object' ? cat._id : cat
      ) || [],
    });
    
    // Set Image Previews
    setImagePreview(banner.image?.url || '');
    setMobileImagePreview(banner.image?.mobile_url || '');
    setImageFile(null);
    setMobileImageFile(null);
    
    setShowModal(true);
  };

  // Image Handlers
  const handleImageChange = (e, type = 'desktop') => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'desktop') {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setMobileImageFile(file);
        setMobileImagePreview(URL.createObjectURL(file));
      }
    }
  };

  // Remove Image
  const removeImage = (type = 'desktop') => {
    if (type === 'desktop') {
      setImagePreview('');
      setImageFile(null);
    } else {
      setMobileImagePreview('');
      setMobileImageFile(null);
    }
  };

  // Category Selection Handler
  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const current = [...prev.specificCategories];
      if (current.includes(categoryId)) {
        return { ...prev, specificCategories: current.filter(id => id !== categoryId) };
      } else {
        return { ...prev, specificCategories: [...current, categoryId] };
      }
    });
  };

  // ==================== SUBMIT HANDLER ====================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      
      // ========== BASIC FIELDS ==========
      data.append('title', formData.title);
      data.append('subtitle', formData.subtitle || '');
      data.append('link', formData.link || '');
      data.append('buttonText', formData.buttonText);
      data.append('position', formData.position);
      data.append('priority', formData.priority);
      data.append('status', formData.status);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('backgroundColor', formData.backgroundColor);
      data.append('textColor', formData.textColor);
      
      // ========== DISPLAY CONDITIONS ==========
      data.append('displayConditions[showOnHome]', formData.showOnHome);
      data.append('displayConditions[showOnShop]', formData.showOnShop);
      data.append('displayConditions[showOnCourse]', formData.showOnCourse);
      data.append('displayConditions[showOnProductDetail]', formData.showOnProductDetail);
      
      // ========== TARGET AUDIENCE ==========
      data.append('targetAudience[all]', formData.targetAll);
      data.append('targetAudience[newUsers]', formData.targetNewUsers);
      data.append('targetAudience[returningUsers]', formData.targetReturningUsers);
      
      // Specific Categories (array)
      formData.specificCategories.forEach((catId, index) => {
        data.append(`targetAudience[specificCategories][${index}]`, catId);
      });
      
      // ========== IMAGES ==========
      if (imageFile) {
        data.append('image', imageFile);
      }
      // Note: Mobile image handling depends on backend implementation
      
      // ========== API CALL ==========
      if (selectedBanner) {
        // UPDATE existing banner
        await axiosInstance.patch(`/banners/${selectedBanner._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // CREATE new banner
        await axiosInstance.post('/banners', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert(error.response?.data?.message || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  
  // Run Schedule Check (Cron Job Manual Trigger)
  const runScheduleCheck = async () => {
    try {
      const response = await axiosInstance.post('/banners/schedule-check');
      alert(`Schedule check completed!\nActivated: ${response.data.activated}\nDeactivated: ${response.data.deactivated}`);
      fetchBanners();
    } catch (error) {
      console.error('Error running schedule check:', error);
    }
  };

  // Status Color Helper
  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Position Color Helper
  const getPositionColor = (position) => {
    const colors = {
      hero: 'bg-blue-100 text-blue-700 border-blue-200',
      promo: 'bg-purple-100 text-purple-700 border-purple-200',
      sidebar: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      popup: 'bg-red-100 text-red-700 border-red-200',
      footer: 'bg-gray-100 text-gray-700 border-gray-200',
      category: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[position] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Check if banner is expired
  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  // Check if banner is currently active
  const isCurrentlyActive = (banner) => {
    const now = new Date();
    return (
      banner.status === 'active' &&
      new Date(banner.startDate) <= now &&
      new Date(banner.endDate) >= now
    );
  };

  // ==================== RENDER ====================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex"> {/* 🔴 ADDED: flex layout wrapper */}
      {/* 🔴 ADDED: AdminSidebar component */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* 🔴 UPDATED: Main content wrapper with flex-1 */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        
        {/* 🔴 ADDED: Mobile menu button for sidebar */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 🔴 UPDATED: Content wrapped in container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* ==================== HEADER ==================== */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Banners</h1>
              <p className="text-gray-500 mt-1">Create and manage promotional banners</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={runScheduleCheck}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Schedule Check
              </button>
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </button>
            </div>
          </div>

          {/* ==================== FILTERS ==================== */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
              <Filter className="w-4 h-4" />
              Filters
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-gray-600 mb-1">Position</label>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Positions</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  {statuses.map(stat => (
                    <option key={stat} value={stat}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterPosition(''); setFilterStatus(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* ==================== BANNERS GRID ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div 
                key={banner._id} 
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                  isCurrentlyActive(banner) ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                {/* Image Section */}
                <div className="aspect-video bg-gray-100 relative group">
                  <img
                    src={banner.image?.url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPositionColor(banner.position)}`}>
                      {banner.position}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(banner.status)}`}>
                      {banner.status}
                    </span>
                  </div>
                  
                  {/* Expired Badge */}
                  {isExpired(banner.endDate) && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Expired
                    </div>
                  )}
                  
                  {/* Display Conditions Badges */}
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    {banner.displayConditions?.showOnHome && (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Home</span>
                    )}
                    {banner.displayConditions?.showOnShop && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Shop</span>
                    )}
                    {banner.displayConditions?.showOnCourse && (
                      <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">Course</span>
                    )}
                    {banner.displayConditions?.showOnProductDetail && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Product</span>
                    )}
                  </div>
                  
                  {/* Priority Badge */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    Priority: {banner.priority}
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{banner.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{banner.subtitle}</p>
                  
                  {/* Meta Info */}
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Button:</span>
                      <span className="font-medium">{banner.buttonText}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Start:</span>
                      <span>{new Date(banner.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End:</span>
                      <span className={isExpired(banner.endDate) ? 'text-red-500' : ''}>
                        {new Date(banner.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    {banner.daysRemaining > 0 && (
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className={banner.daysRemaining < 3 ? 'text-red-500 font-medium' : ''}>
                          {banner.daysRemaining} days
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>CTR:</span>
                      <span className="font-medium">{banner.ctr || 0}%</span>
                    </div>
                  </div>
                  
                  {/* Target Audience */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {banner.targetAudience?.all && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">All Users</span>
                    )}
                    {banner.targetAudience?.newUsers && (
                      <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">New</span>
                    )}
                    {banner.targetAudience?.returningUsers && (
                      <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs">Returning</span>
                    )}
                  </div>
                  
                  {/* Color Preview */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <span>Colors:</span>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: banner.backgroundColor || '#ffffff' }}
                      title="Background"
                    />
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: banner.textColor || '#ffffff' }}
                      title="Text"
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewAnalytics(banner)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Link Preview */}
                    {banner.link && (
                      <a 
                        href={banner.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:underline truncate max-w-[150px]"
                      >
                        View Link →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> {/* 🔴 CLOSED: Content container */}
      </div> {/* 🔴 CLOSED: Main content flex-1 wrapper */}

      {/* ==================== ADD/EDIT MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* ========== SECTION: IMAGES ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Banner Images</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Desktop Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desktop Image {selectedBanner ? '' : '*'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-48 mx-auto rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('desktop')}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-8">
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <span className="text-gray-600 font-medium">Click to upload</span>
                          <p className="text-xs text-gray-400 mt-1">Recommended: 1920x600px</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'desktop')}
                            className="hidden"
                            required={!selectedBanner}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Mobile Image (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Image <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                      {mobileImagePreview ? (
                        <div className="relative">
                          <img 
                            src={mobileImagePreview} 
                            alt="Mobile Preview" 
                            className="max-h-48 mx-auto rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('mobile')}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-8">
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <span className="text-gray-600 font-medium">Click to upload</span>
                          <p className="text-xs text-gray-400 mt-1">Recommended: 768x400px</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'mobile')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== SECTION: BASIC INFO ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title * <span className="text-gray-400">(Max 200 chars)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      maxLength={200}
                      placeholder="Enter banner title"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle <span className="text-gray-400">(Max 500 chars)</span>
                    </label>
                    <textarea
                      value={formData.subtitle}
                      onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      maxLength={500}
                      placeholder="Enter subtitle or description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({...formData, link: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/page"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Shop Now"
                    />
                  </div>
                </div>
              </div>

              {/* ========== SECTION: POSITION & PRIORITY ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Position & Priority</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {positions.map(pos => (
                        <option key={pos} value={pos}>
                          {pos.charAt(0).toUpperCase() + pos.slice(1)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Where the banner will appear</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-gray-400">(Higher = First)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {statuses.map(stat => (
                        <option key={stat} value={stat}>
                          {stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ========== SECTION: SCHEDULE ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ========== SECTION: COLORS ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Appearance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== SECTION: DISPLAY CONDITIONS ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Display Conditions</h3>
                <p className="text-sm text-gray-500">Select which pages this banner should appear on</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showOnHome}
                      onChange={(e) => setFormData({...formData, showOnHome: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium">Home Page</span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showOnShop}
                      onChange={(e) => setFormData({...formData, showOnShop: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium">Shop Page</span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showOnCourse}
                      onChange={(e) => setFormData({...formData, showOnCourse: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium">Course Page</span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showOnProductDetail}
                      onChange={(e) => setFormData({...formData, showOnProductDetail: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium">Product Detail</span>
                  </label>
                </div>
              </div>

              {/* ========== SECTION: TARGET AUDIENCE ========== */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Target Audience</h3>
                
                <div className="space-y-4">
                  {/* User Types */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetAll}
                        onChange={(e) => setFormData({...formData, targetAll: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm font-medium">All Users</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetNewUsers}
                        onChange={(e) => setFormData({...formData, targetNewUsers: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm font-medium">New Users</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetReturningUsers}
                        onChange={(e) => setFormData({...formData, targetReturningUsers: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm font-medium">Returning Users</span>
                    </label>
                  </div>

                  {/* Specific Categories */}
                  {!formData.targetAll && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Categories
                      </label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                        {availableCategories.length === 0 ? (
                          <p className="text-sm text-gray-500">No categories available</p>
                        ) : (
                          availableCategories.map((category) => (
                            <label key={category._id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.specificCategories.includes(category._id)}
                                onChange={() => handleCategoryToggle(category._id)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="ml-2 text-sm">{category.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ========== FORM ACTIONS ========== */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    selectedBanner ? 'Update Banner' : 'Create Banner'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ANALYTICS MODAL ==================== */}
      {showAnalyticsModal && analyticsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Banner Analytics</h2>
              <button 
                onClick={() => setShowAnalyticsModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.impressionCount || 0}</p>
                  <p className="text-sm text-gray-600 font-medium">Impressions</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                  <p className="text-3xl font-bold text-green-600">{analyticsData.clickCount || 0}</p>
                  <p className="text-sm text-gray-600 font-medium">Clicks</p>
                </div>
              </div>
              
              {/* CTR */}
              <div className="bg-purple-50 p-6 rounded-xl text-center border border-purple-100">
                <p className="text-4xl font-bold text-purple-600">{analyticsData.ctr || 0}%</p>
                <p className="text-sm text-gray-600 font-medium mt-1">Click Through Rate</p>
              </div>
              
              {/* Days Remaining */}
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-600">
                  Days Remaining: {' '}
                  <span className={`font-bold text-lg ${analyticsData.daysRemaining < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                    {analyticsData.daysRemaining || 0}
                  </span>
                </p>
              </div>
              
              {/* Banner Info */}
              {selectedBanner && (
                <div className="border-t pt-4 text-sm text-gray-500 space-y-1">
                  <p><span className="font-medium">Title:</span> {selectedBanner.title}</p>
                  <p><span className="font-medium">Position:</span> {selectedBanner.position}</p>
                  <p><span className="font-medium">Status:</span> {selectedBanner.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div> 
  );
};

export default ManageBanners;