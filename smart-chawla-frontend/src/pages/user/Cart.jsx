import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { removeFromCart, updateQuantity } from "../../redux/slices/cartSlice";
import { formatPrice } from "../../utils/formatters";

const Cart = () => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);

  const handleQuantityChange = (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      dispatch(
        updateQuantity({
          itemId: item.itemId,
          itemType: item.itemType,
          quantity: newQuantity,
        }),
      );
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.itemType}-${item.itemId}`}
              className="flex flex-col sm:flex-row items-center sm:items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 gap-4"
            >
              {/* ইমেজ সেকশন */}
              <img
                src={item.image || "/placeholder.jpg"}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg shrink-0"
                loading="lazy"
                fetchpriority="high"
              />

              {/* টেক্সট সেকশন - মোবাইলে সেন্টার অ্যালাইন করা হয়েছে */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs text-gray-500 capitalize">
                  {item.itemType}
                </p>
                <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-purple-600 font-medium">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* কোয়ান্টিটি এবং প্রাইস সেকশনকে মোবাইলে পাশাপাশি রাখার জন্য একটি কন্টেইনার */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                {/* প্লাস মাইনাস বাটন */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* টোটাল প্রাইস এবং ডিলিট বাটন */}
                <div className="text-right flex items-center gap-3">
                  <div className="flex flex-col">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      dispatch(
                        removeFromCart({
                          itemId: item.itemId,
                          itemType: item.itemType,
                        }),
                      )
                    }
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-purple-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full mt-6 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 flex items-center justify-center"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
