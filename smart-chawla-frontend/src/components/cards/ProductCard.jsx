// components/cards/ProductCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Star, Heart, Zap, ShoppingCart } from 'lucide-react';
import { useSelector } from 'react-redux';
import { formatPrice } from '../../utils/formatters';
import WishlistButton from '../common/WishlistButton';
import AddToCartButton from '../common/AddToCartButton';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const cartItem = {
    itemType: 'product',
    itemId: product._id,
    name: product.name,
    price: product.discountPrice || product.price,
    image: product.images?.[0]?.url,
    stock: product.stock,
  };

  // Determine badge color based on discount
  const getDiscountBadgeColor = (percentage) => {
    if (percentage >= 50) return 'bg-gradient-to-r from-rose-500 to-red-600';
    if (percentage >= 30) return 'bg-gradient-to-r from-accent to-amber-500';
    return 'bg-gradient-to-r from-secondary-500 to-secondary-600';
  };

  return (
    <div
      className={`
        group relative bg-white rounded-2xl shadow-soft border border-neutral-100 
        overflow-hidden transition-all duration-500 ease-out
        hover:shadow-premium hover:border-primary-200 hover:-translate-y-1
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
        <div className="aspect-square overflow-hidden bg-neutral-50 relative">
          {/* Skeleton Loader */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-neutral-100 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                   style={{ backgroundSize: '200% 100%' }} />
            </div>
          )}
          
          <img
            src={product.images?.[0]?.url || '/placeholder-product.jpg'}
            alt={product.name}
            onLoad={() => setIsImageLoaded(true)}
            className={`
              w-full h-full object-cover transition-all duration-700 ease-out
              ${isHovered ? 'scale-110' : 'scale-100'}
              ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />
          
          {/* Overlay Gradient on Hover */}
          <div className={`
            absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent
            transition-opacity duration-500
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `} />
        </div>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className={`
            absolute top-3 left-3 ${getDiscountBadgeColor(discountPercentage)} 
            text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg
            transform transition-all duration-300
            ${isHovered ? 'scale-105' : 'scale-100'}
          `}>
            <span className="flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              -{discountPercentage}%
            </span>
          </div>
        )}

        {/* Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-3 right-3 bg-neutral-800/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            আউট অফ স্টক
          </div>
        )}

        {/* New Arrival Badge */}
        {product.isNew && (
          <div className="absolute top-3 left-3 bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            নতুন
          </div>
        )}

        {/* Quick Actions - Slide Up */}
        <div className={`
          absolute inset-x-0 bottom-0 p-4 flex justify-center items-end space-x-3
          transition-all duration-500 ease-out
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}>
          {/* Add to Cart Icon */}
          <div className="transform transition-all duration-300 delay-75 hover:scale-110">
            <AddToCartButton
              item={cartItem}
              variant="icon"
              className="w-12 h-12 bg-white rounded-full shadow-lg hover:bg-primary-500 hover:text-white transition-all duration-300 flex items-center justify-center"
            />
          </div>

          {/* Wishlist Button */}
          <div className="transform transition-all duration-300 delay-100 hover:scale-110">
            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose-50 transition-all duration-300 group/wishlist">
              <WishlistButton
                itemType="product"
                itemId={product._id}
                name={product.name}
                price={product.discountPrice || product.price}
                image={product.images?.[0]?.url}
                slug={product.slug}
                description={product.description}
                iconClassName="group-hover/wishlist:text-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick View */}
          <Link
            to={`/product/${product.slug}`}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-neutral-700 hover:bg-primary-500 hover:text-white transition-all duration-300 transform hover:scale-110 delay-150"
            title="দ্রুত দেখুন"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Category Tag */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
            {typeof product.category?.name === 'object' 
              ? (product.category?.name?.bn || product.category?.name?.en)
              : product.category?.name}
          </span>
          
          {/* Trust Badge */}
          {product.isVerified && (
            <span className="text-[10px] text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-full flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              ভেরিফাইড
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-neutral-800 line-clamp-2 hover:text-primary-600 transition-colors duration-300 font-bangla leading-relaxed min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mt-3">
          <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`
                  w-4 h-4 transition-all duration-200
                  ${i < Math.round(product.averageRating || 0)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-neutral-200'
                  }
                  ${isHovered && i < Math.round(product.averageRating || 0) ? 'scale-110' : ''}
                `}
                style={{ transitionDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500 ml-2 font-medium">
            ({product.ratings?.length || 0} রিভিউ)
          </span>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline mt-4 pt-3 border-t border-neutral-100">
          {product.discountPrice ? (
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-primary-600 font-bangla">
                {formatPrice(product.discountPrice)}
              </span>
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs font-medium text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-full">
                সাশ্রয়ী
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-primary-600 font-bangla">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className={`
        absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary-200 ring-offset-2" />
      </div>
    </div>
  );
};

export default ProductCard;