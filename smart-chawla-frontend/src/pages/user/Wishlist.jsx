// pages/user/Wishlist.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  ShoppingBag,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { 
  removeFromWishlist, 
  moveToCart,
  clearWishlist 
} from '../../redux/slices/wishlistSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { formatPrice } from '../../utils/formatters';
import axiosInstance from '../../utils/axiosInstance';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, itemCount } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sync with server if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncWishlistWithServer();
    }
  }, [isAuthenticated]);

  const syncWishlistWithServer = async () => {
    try {
      setSyncing(true);
      const response = await axiosInstance.get('/wishlist');
      // Merge server wishlist with local
      // dispatch(syncWishlist(response.data.items));
    } catch (error) {
      console.error('Error syncing wishlist:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleRemove = (itemId, itemType, name) => {
    if (window.confirm(`"${name}" আপনার wishlist থেকে সরাবেন?`)) {
      dispatch(removeFromWishlist({ itemId, itemType }));
      
      // If authenticated, also remove from server
      if (isAuthenticated) {
        axiosInstance.delete(`/wishlist/${itemType}/${itemId}`).catch(console.error);
      }
    }
  };

  const handleMoveToCart = (item) => {
    dispatch(addToCart({
      itemType: item.itemType,
      itemId: item.itemId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    }));
    
    dispatch(moveToCart({ itemId: item.itemId, itemType: item.itemType }));
    
    // Show success message
    alert(`${item.name} কার্টে যোগ করা হয়েছে!`);
  };

  const handleClearWishlist = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সম্পূর্ণ wishlist খালি করতে চান?')) {
      dispatch(clearWishlist());
      
      if (isAuthenticated) {
        axiosInstance.delete('/wishlist/clear').catch(console.error);
      }
      
      setShowClearConfirm(false);
    }
  };

  const getItemIcon = (itemType) => {
    return itemType === 'course' ? BookOpen : ShoppingBag;
  };

  const getItemLink = (item) => {
    return `/${item.itemType}/${item.slug}`;
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-12 max-w-md mx-auto">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-purple-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              আপনার Wishlist খালি
            </h2>
            <p className="text-gray-600 mb-8">
              পছন্দের প্রোডাক্ট এবং কোর্স এখানে সেভ করুন পরে দেখার জন্য
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                শপে যান
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                কোর্স ব্রাউজ করুন
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              আমার Wishlist
            </h1>
            <p className="text-gray-600 mt-1">
              {itemCount} টি আইটেম সেভ করা আছে
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {syncing && (
              <span className="text-sm text-gray-500">সিঙ্ক হচ্ছে...</span>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              সব খালি করুন
            </button>
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
                <h3 className="text-lg font-bold">নিশ্চিত করুন</h3>
              </div>
              <p className="text-gray-600 mb-6">
                আপনি কি নিশ্চিত যে সম্পূর্ণ wishlist খালি করতে চান?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  খালি করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const ItemIcon = getItemIcon(item.itemType);
            
            return (
              <div
                key={`${item.itemType}-${item.itemId}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <Link 
                  to={getItemLink(item)}
                  className="block relative aspect-video overflow-hidden bg-gray-100"
                >
                  <img
                    src={item.image || '/placeholder.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.itemType === 'course' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <ItemIcon className="w-3 h-3 mr-1" />
                      {item.itemType === 'course' ? 'কোর্স' : 'প্রোডাক্ট'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(item.itemId, item.itemType, item.name);
                      }}
                      className="p-2 bg-white/90 rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link to={getItemLink(item)}>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-purple-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  
                  {item.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-purple-600">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.addedAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="w-full flex items-center justify-center py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    কার্টে যোগ করুন
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">আরও আইটেম যোগ করতে চান?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              শপিং চালিয়ে যান
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              কোর্স ব্রাউজ করুন
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;