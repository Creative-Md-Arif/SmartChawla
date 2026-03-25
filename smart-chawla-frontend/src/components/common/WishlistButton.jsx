// components/common/WishlistButton.jsx
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { Heart } from 'lucide-react';

const WishlistButton = ({ 
  itemType,      // 'product' or 'course'
  itemId,
  name,
  price,
  image,
  slug,
  description,
  className = '',
  showText = false 
}) => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.wishlist);
  
  const isInWishlist = items.some(
    (item) => item.itemId === itemId && item.itemType === itemType
  );

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlist) {
      dispatch(removeFromWishlist({ itemId, itemType }));
    } else {
      dispatch(toggleWishlist({
        itemType,
        itemId,
        name,
        price,
        image,
        slug,
        description,
      }));
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center transition-colors ${className}`}
      title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <Heart
        className={`w-6 h-6 ${
          isInWishlist 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 hover:text-red-500'
        }`}
      />
      {showText && (
        <span className={`ml-2 ${isInWishlist ? 'text-red-500' : 'text-gray-600'}`}>
          {isInWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;