// components/common/AddToCartButton.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ShoppingCart,
  Check,
  Loader2,
  Plus,
  Minus,
  Package,
  Sparkles,
} from "lucide-react";
import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
} from "../../redux/slices/cartSlice";

const AddToCartButton = ({
  item = {}, 
  variant = "default",
  className = "",
  showQuantity = false,
  onAddSuccess,
  onAddError,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cartState = useSelector((state) => state.cart);
  const items = cartState?.items || [];

  const cartItem = items.find(
    (i) => i.itemId === item.itemId && i.itemType === item.itemType,
  );
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

  const handleAddToCart = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (item.stock === 0) {
      onAddError?.("Out of stock");
      return;
    }

    setLoading(true);

    try {
      dispatch(
        addToCart({
          itemType: item.itemType,
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        }),
      );

      setAdded(true);
      onAddSuccess?.();

      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      onAddError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (item.stock && quantity >= item.stock) return;

    dispatch(
      increaseQuantity({
        itemId: item.itemId,
        itemType: item.itemType,
      }),
    );
  };

  const handleDecrease = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    dispatch(
      decreaseQuantity({
        itemId: item.itemId,
        itemType: item.itemType,
      }),
    );
  };

  // Icon only button
  if (variant === "icon") {
    return (
      <button
        onClick={handleAddToCart}
        disabled={loading || item.stock === 0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center 
          transition-all duration-300 ease-out transform
          ${
            added
              ? "bg-secondary-500 text-white shadow-glow scale-110"
              : item.stock === 0
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-white text-neutral-700 hover:bg-primary-500 hover:text-white hover:shadow-glow hover:scale-110 hover:-translate-y-1"
          } 
          ${className}
        `}
        title={item.stock === 0 ? "আউট অফ স্টক" : "কার্টে যোগ করুন"}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : added ? (
          <Check className="w-5 h-5 animate-bounce" />
        ) : (
          <ShoppingCart
            className={`
            w-5 h-5 transition-transform duration-300
            ${isHovered ? "scale-110" : ""}
          `}
          />
        )}
      </button>
    );
  }

  // Compact button
  if (variant === "compact") {
    return (
      <button
        onClick={handleAddToCart}
        disabled={loading || item.stock === 0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          flex items-center px-4 py-2 rounded-xl text-sm font-medium 
          transition-all duration-300 ease-out
          ${
            added
              ? "bg-secondary-50 text-secondary-600 border border-secondary-200 shadow-soft"
              : item.stock === 0
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-500 hover:text-white hover:shadow-glow hover:border-primary-500"
          } 
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : added ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            <span className="font-bangla">যোগ হয়েছে</span>
          </>
        ) : (
          <>
            <ShoppingCart
              className={`
              w-4 h-4 mr-2 transition-transform duration-300
              ${isHovered ? "scale-110" : ""}
            `}
            />
            <span className="font-bangla">কার্টে যোগ করুন</span>
          </>
        )}
      </button>
    );
  }

  // Quantity controls
  if (variant === "quantity" || showQuantity) {
    if (!isInCart) {
      return (
        <button
          onClick={handleAddToCart}
          disabled={loading || item.stock === 0}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            flex items-center justify-center px-6 py-3 rounded-xl font-medium
            transition-all duration-300 ease-out transform
            ${
              item.stock === 0
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-glow hover:scale-[1.02] hover:-translate-y-0.5"
            } 
            ${className}
          `}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ShoppingCart
                className={`
                w-5 h-5 mr-2 transition-transform duration-300
                ${isHovered ? "scale-110" : ""}
              `}
              />
              <span className="font-bangla">কার্টে যোগ করুন</span>
            </>
          )}
        </button>
      );
    }

    return (
      <div
        className={`
        flex items-center space-x-3 p-2 bg-neutral-50 rounded-2xl border border-neutral-200
        ${className}
      `}
      >
        <button
          onClick={handleDecrease}
          className={`
            w-10 h-10 rounded-xl bg-white border border-neutral-200 
            flex items-center justify-center shadow-soft
            hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600
            transition-all duration-200 active:scale-95
          `}
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center min-w-[3rem]">
          <span className="text-lg font-bold text-neutral-800">{quantity}</span>
          <span className="text-[10px] text-neutral-400 font-bangla">পিস</span>
        </div>

        <button
          onClick={handleIncrease}
          disabled={item.stock && quantity >= item.stock}
          className={`
            w-10 h-10 rounded-xl bg-white border border-neutral-200 
            flex items-center justify-center shadow-soft
            hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600
            transition-all duration-200 active:scale-95
            ${item.stock && quantity >= item.stock ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Default button (full)
  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || item.stock === 0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        flex items-center justify-center w-full px-6 py-4 rounded-xl font-medium
        transition-all duration-300 ease-out transform
        ${
          added
            ? "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-glow"
            : item.stock === 0
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              : "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-glow hover:scale-[1.02] hover:-translate-y-0.5"
        } 
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          <span className="font-bangla">যোগ হচ্ছে...</span>
        </>
      ) : added ? (
        <>
          <Check className="w-5 h-5 mr-3 animate-bounce" />
          <span className="font-bangla">কার্টে যোগ হয়েছে!</span>
          <Sparkles className="w-4 h-4 ml-2 text-yellow-300 animate-pulse" />
        </>
      ) : item.stock === 0 ? (
        <span className="flex items-center font-bangla">
          <Package className="w-5 h-5 mr-2" />
          স্টক শেষ
        </span>
      ) : (
        <>
          <ShoppingCart
            className={`
            w-5 h-5 mr-3 transition-transform duration-300
            ${isHovered ? "scale-110" : ""}
          `}
          />
          <span className="font-bangla">কার্টে যোগ করুন</span>
        </>
      )}
    </button>
  );
};

export default AddToCartButton;
