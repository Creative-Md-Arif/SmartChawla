// components/cards/ProductCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Star, Heart, Zap, ShoppingCart } from "lucide-react";
import { useSelector } from "react-redux";
import { formatPrice } from "../../utils/formatters";
import WishlistButton from "../common/WishlistButton";
import AddToCartButton from "../common/AddToCartButton";

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const discountPercentage = product.discountPrice
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100,
      )
    : 0;

  const cartItem = {
    itemType: "product",
    itemId: product._id,
    name: product.name,
    price: product.discountPrice || product.price,
    image: product.images?.[0]?.url,
    stock: product.stock,
  };

  // Determine badge color based on discount
  const getDiscountBadgeColor = (percentage) => {
    if (percentage >= 50) return "bg-gradient-to-r from-rose-500 to-red-600";
    if (percentage >= 30) return "bg-gradient-to-r from-accent to-amber-500";
    return "bg-gradient-to-r from-secondary-500 to-secondary-600";
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
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden"
      >
        <div className="aspect-square overflow-hidden bg-neutral-50 relative group rounded-t-xl sm:rounded-t-2xl">
          {/* Skeleton Loader - Optimized for mobile view */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-neutral-100 animate-pulse z-10">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                style={{ backgroundSize: "200% 100%" }}
              />
            </div>
          )}

          {/* Product Image - Enhanced transition and fit */}
          <img
            src={product.images?.[0]?.url || "/placeholder-product.jpg"}
            alt={product.name}
            onLoad={() => setIsImageLoaded(true)}
            className={`
      w-full h-full object-cover transition-all duration-700 ease-out
      ${isHovered ? "scale-105 sm:scale-110" : "scale-100"}
      ${isImageLoaded ? "opacity-100" : "opacity-0"}
    `}
          />

          {/* Overlay Gradient on Hover - Made subtler for small screens */}
          <div
            className={`
      absolute inset-0 bg-gradient-to-t from-neutral-900/40 sm:from-neutral-900/60 via-transparent to-transparent
      transition-opacity duration-500 pointer-events-none
      ${isHovered ? "opacity-100" : "opacity-0"}
    `}
          />

          {/* Mobile Touch Feedback (Optional visual cue) */}
          <div className="absolute inset-0 bg-white/5 opacity-0 active:opacity-100 transition-opacity duration-100 sm:hidden" />
        </div>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div
            className={`
      absolute top-1.5 left-1.5 sm:top-3 sm:left-3 
      ${getDiscountBadgeColor(discountPercentage)} 
      text-white font-black rounded-full shadow-lg
      px-2 py-1 sm:px-3 sm:py-1.5
      text-[10px] sm:text-xs
      transform transition-all duration-300 z-10
      ${isHovered ? "scale-110 sm:scale-105" : "scale-100"}
    `}
          >
            <span className="flex items-center tracking-tighter sm:tracking-normal">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-current" />
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
            New
          </div>
        )}

        {/* Quick Actions - Slide Up */}
        <div
          className={`
    absolute inset-x-0 bottom-0 p-2 sm:p-4 flex justify-center items-center gap-1.5 sm:gap-3
    transition-all duration-500 ease-out z-20
    ${isHovered ? "opacity-100 translate-y-[-8px] sm:translate-y-0" : "opacity-0 translate-y-4 sm:translate-y-8"}
  `}
        >
          {/* Add to Cart Icon - Scaled for 320px */}
          <div className="transform transition-all duration-300 delay-75 hover:scale-110 active:scale-90">
            <AddToCartButton
              item={cartItem}
              variant="icon"
              className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-full shadow-xl hover:bg-purple-600 hover:text-white transition-all duration-300 flex items-center justify-center border border-neutral-100"
            />
          </div>

          {/* Wishlist Button - Scaled for 320px */}
          <div className="transform transition-all duration-300 delay-100 hover:scale-110 active:scale-90">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-rose-50 transition-all duration-300 group/wishlist border border-neutral-100">
              <WishlistButton
                itemType="product"
                itemId={product._id}
                name={product.name}
                price={product.discountPrice || product.price}
                image={product.images?.[0]?.url}
                slug={product.slug}
                description={product.description}
                iconClassName="group-hover/wishlist:text-rose-500 transition-colors w-4 h-4 sm:w-5 sm:h-5"
              />
            </div>
          </div>

          {/* Quick View - Scaled for 320px */}
          <Link
            to={`/product/${product.slug}`}
            className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-neutral-700 hover:bg-purple-600 hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-90 delay-150 border border-neutral-100"
            title="দ্রুত দেখুন"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category Tag */}
        <div className="flex flex-wrap items-center justify-between mb-2 gap-y-1.5 min-h-[24px]">
          {/* Category Badge - Optimized for 320px */}
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-[90px] sm:max-w-none">
            {typeof product.category?.name === "object"
              ? product.category?.name?.bn || product.category?.name?.en
              : product.category?.name}
          </span>

          {/* Trust Badge - Compact alignment */}
          {product.isVerified && (
            <span className="text-[9px] sm:text-[10px] text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center flex-shrink-0 ml-auto font-bold border border-amber-100/50">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-current" />
              ভেরিফাইড
            </span>
          )}
        </div>

        {/* Title */}
        {/* Title Wrapper - mt-2 দিয়ে ক্যাটাগরি থেকে দূরত্ব রাখা হয়েছে */}
        <Link to={`/product/${product.slug}`} className="block mt-2">
          <h3 className="font-bold text-[13px] sm:text-[14px] text-neutral-800 hover:text-purple-600 transition-colors duration-300 font-bangla leading-tight line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating Section - mt-1.5 দিয়ে টাইটেল থেকে নিচে নামানো হয়েছে */}
        <div className="flex items-center gap-1 mt-1.5 min-w-0">
          <div className="flex items-center flex-shrink-0">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
                  i < Math.round(product.averageRating || 0)
                    ? "text-amber-400 fill-amber-400"
                    : "text-neutral-200"
                } ${isHovered && i < Math.round(product.averageRating || 0) ? "scale-110" : ""}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">
            ({product.ratings?.length || 0})
          </span>
        </div>

        {/* Price Section - Removed redundant border & padding */}
        <div className="flex items-baseline flex-wrap gap-x-1.5 mt-2 min-w-0">
          {product.discountPrice ? (
            <>
              <span className="text-base sm:text-lg font-black text-purple-600 font-bangla shrink-0">
                {formatPrice(product.discountPrice)}
              </span>
              <span className="text-[11px] sm:text-xs text-neutral-400 line-through shrink-0 opacity-70">
                {formatPrice(product.price)}
              </span>
              {/* Small Badge - Conditional display for tiny screens */}
              <span className="hidden xs:inline-block text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                সাশ্রয়ী
              </span>
            </>
          ) : (
            <span className="text-base sm:text-lg font-black text-purple-600 font-bangla">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div
        className={`
        absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500
        ${isHovered ? "opacity-100" : "opacity-0"}
      `}
      >
        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary-200 ring-offset-2" />
      </div>
    </div>
  );
};

export default ProductCard;
