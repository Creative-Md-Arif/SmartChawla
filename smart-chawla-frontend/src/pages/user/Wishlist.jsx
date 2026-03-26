// pages/user/Wishlist.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  ShoppingBag,
  BookOpen,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  removeFromWishlist, 
  moveToCart,
  clearWishlist,
  selectWishlistItems,
  selectWishlistCount
} from '../../redux/slices/wishlistSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { formatPrice } from '../../utils/formatters';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Only Redux state - no backend sync
  const items = useSelector(selectWishlistItems);
  const itemCount = useSelector(selectWishlistCount);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [removingItem, setRemovingItem] = useState(null);

  const handleRemove = (item) => {
    setRemovingItem(`${item.itemType}-${item.itemId || item._id}`);
    
    // Small delay for visual feedback
    setTimeout(() => {
      dispatch(removeFromWishlist({ 
        itemId: item.itemId || item._id, 
        itemType: item.itemType 
      }));
      setRemovingItem(null);
    }, 200);
  };

  const handleMoveToCart = (item) => {
    // Add to cart
    dispatch(addToCart({
      itemType: item.itemType,
      itemId: item.itemId || item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    }));
    
    // Remove from wishlist
    dispatch(moveToCart({ 
      itemId: item.itemId || item._id, 
      itemType: item.itemType 
    }));
    
    // Optional: Show toast notification
    showNotification(`${item.name} কার্টে যোগ করা হয়েছে!`);
  };

  const handleClearWishlist = () => {
    dispatch(clearWishlist());
    setShowClearConfirm(false);
  };

  // Simple notification helper
  const showNotification = (message) => {
    // You can replace this with your toast library
    alert(message);
  };

  const getItemIcon = (itemType) => {
    return itemType === 'course' ? BookOpen : ShoppingBag;
  };

  const getItemLink = (item) => {
    return `/${item.itemType}s/${item.slug}`;
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
          
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors mt-4 sm:mt-0"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            সব খালি করুন
          </button>
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
            const itemKey = `${item.itemType}-${item.itemId || item._id}`;
            const isRemoving = removingItem === itemKey;
            
            return (
              <div
                key={itemKey}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-200 ${
                  isRemoving ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                }`}
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
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
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
                  
                  {/* Quick remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item);
                    }}
                    disabled={isRemoving}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="flex-1 flex items-center justify-center py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      কার্টে যোগ করুন
                    </button>
                    
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={isRemoving}
                      className="p-2.5 border border-gray-200 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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