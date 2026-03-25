import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import {
  ShoppingBag, BookOpen, Heart, Package, Award, User, Mail, Phone, MapPin,
  Edit3, Camera, X, Check, Loader2, Plus, Trash2, AlertCircle, ShoppingCart
} from 'lucide-react';
// IMPORT: Redux thunks
import { 
  addAddress, 
  updateAddress, 
  deleteAddress, 
  updateProfile,
  fetchProfile 
} from '../../redux/slices/authSlice';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`}>
      {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

const UserDashboard = () => {
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);


  
  // Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: '', phone: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // Address state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    fullName: '', phone: '', address: '', city: '', district: '', postalCode: '', isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  const [toast, setToast] = useState(null);

  // FIXED: Sync with Redux user data (includes localStorage persistence)
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  // Fetch orders and wishlist
  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axiosInstance.get('/orders/my-orders');
      const ordersData = response.data.orders || response.data.data || [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };


  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Stats
  const stats = useMemo(() => [
    { 
      name: 'Active Orders', 
      value: orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length, 
      icon: ShoppingBag, 
      color: 'bg-blue-500',
      link: '/my-orders'
    },
    { 
      name: 'My Courses', 
      value: user?.purchasedCourses?.length || 0, 
      icon: BookOpen, 
      color: 'bg-green-500',
      link: '/my-courses'
    },

    { 
      name: 'Completed', 
      value: user?.purchasedCourses?.filter(c => c.progress === 100).length || 0, 
      icon: Award, 
      color: 'bg-yellow-500',
      link: '/my-courses'
    },
  ], [orders, user?.purchasedCourses,]);

  const recentCourses = useMemo(() => {
    if (!user?.purchasedCourses?.length) return [];
    return [...user.purchasedCourses]
      .sort((a, b) => new Date(b.lastAccessed || 0) - new Date(a.lastAccessed || 0))
      .slice(0, 3);
  }, [user?.purchasedCourses]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  // Profile handlers
  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Image must be less than 2MB', type: 'error' });
        return;
      }
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  }, []);

  // FIXED: Use Redux thunk for profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('fullName', profileData.fullName);
      formData.append('phone', profileData.phone);
      if (avatarFile) formData.append('avatar', avatarFile);

      await dispatch(updateProfile(formData)).unwrap();
      
      setIsEditingProfile(false);
      setAvatarFile(null);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      setToast({ message: error || 'Failed to update profile', type: 'error' });
    }
  };

  const handleResendVerification = async () => {
    try {
      await axiosInstance.post('/auth/resend-verification');
      setToast({ message: 'Verification email sent!', type: 'success' });
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to send email', type: 'error' });
    }
  };

  // FIXED: Use Redux thunks for addresses - AUTOMATICALLY SAVES TO LOCALSTORAGE
  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addAddress(addressFormData)).unwrap();
      
      setShowAddressForm(false);
      setAddressFormData({ fullName: '', phone: '', address: '', city: '', district: '', postalCode: '', isDefault: false });
      setToast({ message: 'Address added successfully', type: 'success' });
    } catch (error) {
      setToast({ message: error || 'Failed to add address', type: 'error' });
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateAddress({ id: editingAddressId, data: addressFormData })).unwrap();
      
      setEditingAddressId(null);
      setShowAddressForm(false);
      setToast({ message: 'Address updated successfully', type: 'success' });
    } catch (error) {
      setToast({ message: error || 'Failed to update address', type: 'error' });
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await dispatch(deleteAddress(id)).unwrap();
      setToast({ message: 'Address deleted', type: 'success' });
    } catch (error) {
      setToast({ message: error || 'Failed to delete address', type: 'error' });
    }
  };

  const startEditAddress = (address) => {
    setAddressFormData(address);
    setEditingAddressId(address._id);
    setShowAddressForm(true);
  };

  // Wishlist handlers

  const handleAddToCart = async (item) => {
    try {
      await axiosInstance.post('/cart', {
        itemType: item.itemType,
        itemId: item.itemId || item._id,
        quantity: 1
      });
      setToast({ message: 'Added to cart!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add to cart', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getItemIcon = (itemType) => itemType === 'course' ? BookOpen : ShoppingBag;

  if (authLoading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-white/80">
              {user?.addresses?.length || 0} addresses  • {orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length} active orders
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden bg-white/20 hidden sm:block">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-white/70" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Package },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'addresses', label: `Addresses (${user?.addresses?.length || 0})`, icon: MapPin },
         
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <Link key={stat.name} to={stat.link}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.name}</p>
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" /> Recent Orders
                </h2>
                <Link to="/my-orders" className="text-sm text-purple-600 hover:underline">View all</Link>
              </div>
              {ordersLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link key={order._id} to={`/my-orders/${order._id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">#{order.orderNumber || order._id.slice(-6)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>{order.status}</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">৳{order.finalAmount || order.totalAmount}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No orders yet</p>
                </div>
              )}
            </div>

            {/* Courses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" /> Continue Learning
                </h2>
                <Link to="/my-courses" className="text-sm text-purple-600 hover:underline">View all</Link>
              </div>
              {recentCourses.length > 0 ? (
                <div className="space-y-3">
                  {recentCourses.map((courseData, index) => (
                    <Link key={index} to={`/courses/${courseData.course?.slug}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900 line-clamp-1">{courseData.course?.title || 'Course'}</span>
                        <span className="text-xs text-gray-500">{courseData.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${courseData.progress}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No courses yet</p>
                  <Link to="/courses" className="text-purple-600 text-sm mt-2 inline-block">Browse courses</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">My Profile</h2>
            <button onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {isEditingProfile ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit</>}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-gray-400" /></div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="font-medium">Profile Photo</p>
                  <p className="text-sm text-gray-500">Max 2MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="01XXXXXXXXX" />
              </div>

              <button type="submit" disabled={authLoading}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-gray-400" /></div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user?.fullName}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {user?.role === 'admin' ? 'Administrator' : 'Member'}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user?.email}</p>
                    {user?.isVerified ? (
                      <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>
                    ) : (
                      <button onClick={handleResendVerification} className="text-xs text-yellow-600 underline">Resend verification</button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Addresses Tab - FIXED with Redux */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">My Addresses ({user?.addresses?.length || 0})</h2>
            <button onClick={() => {
              setShowAddressForm(!showAddressForm);
              setEditingAddressId(null);
              setAddressFormData({ fullName: '', phone: '', address: '', city: '', district: '', postalCode: '', isDefault: false });
            }} disabled={authLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {showAddressForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Address</>}
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input type="text" placeholder="Full Name" value={addressFormData.fullName}
                  onChange={(e) => setAddressFormData({...addressFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                <input type="tel" placeholder="Phone" value={addressFormData.phone}
                  onChange={(e) => setAddressFormData({...addressFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <textarea placeholder="Address" value={addressFormData.address}
                onChange={(e) => setAddressFormData({...addressFormData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="2" required />
              <div className="grid md:grid-cols-3 gap-3">
                <input type="text" placeholder="City" value={addressFormData.city}
                  onChange={(e) => setAddressFormData({...addressFormData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                <input type="text" placeholder="District" value={addressFormData.district}
                  onChange={(e) => setAddressFormData({...addressFormData, district: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Postal Code" value={addressFormData.postalCode}
                  onChange={(e) => setAddressFormData({...addressFormData, postalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={addressFormData.isDefault}
                  onChange={(e) => setAddressFormData({...addressFormData, isDefault: e.target.checked})}
                  className="rounded" />
                <span className="text-sm">Set as default address</span>
              </label>
              <button type="submit" disabled={authLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAddressId ? 'Update Address' : 'Save Address')}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {user?.addresses?.length > 0 ? user.addresses.map((addr) => (
              <div key={addr._id} className={`p-4 border rounded-lg ${addr.isDefault ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{addr.fullName}</p>
                      {addr.isDefault && <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">Default</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{addr.phone}</p>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                    <p className="text-sm text-gray-600">{addr.city}{addr.district && `, ${addr.district}`} {addr.postalCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditAddress(addr)} className="p-2 text-gray-600 hover:text-purple-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAddress(addr._id)} disabled={authLoading}
                      className="p-2 text-gray-600 hover:text-red-600 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No addresses saved</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Verification Banner */}
      {!user?.isVerified && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Verify your email</p>
              <p className="text-sm text-yellow-700">Please verify to access all features</p>
            </div>
          </div>
          <button onClick={handleResendVerification} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">
            Resend Email
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;