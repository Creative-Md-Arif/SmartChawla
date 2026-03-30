import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Truck,
  MapPin,
  Tag,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { formatPrice } from "../../utils/formatters";
import FileUploadButton from "../../components/form/FileUploadButton";
import { enrollMultipleCourses } from "../../redux/slices/enrollSlice";
import InputField from "../../components/form/InputField";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
  validateCoupon,
  applyCouponCode,
  removeCoupon,
  clearValidationError,
} from "../../redux/slices/couponSlice";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, totalAmount } = useSelector((state) => state.cart);
  const {
    appliedCoupon,
    discountAmount,
    loading: couponLoading,
    validationError,
  } = useSelector((state) => state.coupon);
  const { user } = useSelector((state) => state.auth);

  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponList, setShowCouponList] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });

  // Calculate final amount with discount
  const subtotal = totalAmount;
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const isDigitalOnly = items.every((item) => item.itemType === "course");

  // Fetch available coupons on mount
  useEffect(() => {
    fetchAvailableCoupons();
    // Clear any previous validation errors
    dispatch(clearValidationError());
  }, [dispatch]);

  const fetchAvailableCoupons = async () => {
    try {
      const response = await axiosInstance.get("/coupons/my-coupons");
      if (response.data.availableCoupons) {
        setAvailableCoupons(response.data.availableCoupons);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  // Handle coupon validation
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const itemsData = items.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const result = await dispatch(
      validateCoupon({
        code: couponCode,
        subtotal: subtotal,
        items: itemsData,
      }),
    ).unwrap();

    if (result.valid) {
      toast.success("Coupon is valid! Click apply to use it.");
    } else {
      toast.error(result.reason || "Invalid coupon");
    }
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    const itemsData = items.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const result = await dispatch(
      applyCouponCode({
        code: couponCode,
        subtotal: subtotal,
        items: itemsData,
      }),
    ).unwrap();

    if (result.valid) {
      toast.success(
        `Coupon applied! You saved ${formatPrice(result.discount)}`,
      );
      setCouponCode("");
    } else {
      toast.error(result.reason || "Failed to apply coupon");
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    toast.success("Coupon removed");
  };

  // Quick apply from available coupons
  const handleQuickApply = async (code) => {
    setCouponCode(code);
    const itemsData = items.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const result = await dispatch(
      applyCouponCode({
        code,
        subtotal: subtotal,
        items: itemsData,
      }),
    ).unwrap();

    if (result.valid) {
      toast.success(
        `Coupon ${code} applied! You saved ${formatPrice(result.discount)}`,
      );
      setShowCouponList(false);
    } else {
      toast.error(result.reason || "Failed to apply coupon");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIX 1: Validate transaction ID before submitting
    if (!transactionId || transactionId.trim() === "") {
      toast.error("Please enter the Transaction ID from your payment");
      return;
    }

    if (transactionId.trim().length < 5) {
      toast.error("Transaction ID must be at least 5 characters");
      return;
    }

    // ✅ FIX 2: Alphanumeric validation (remove special characters)
    const txnRegex = /^[a-zA-Z0-9]+$/;
    if (!txnRegex.test(transactionId.trim())) {
      toast.error("Transaction ID should contain only letters and numbers");
      return;
    }

    // ✅ FIX 3: Check if screenshot is provided (optional but recommended)
    if (!screenshot) {
      toast.error("Please upload payment screenshot as proof");
      return;
    }

    setLoading(true);

    try {
      // ✅ FIX 4: Prepare items data with all required fields
      const itemsData = items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: item.quantity,
        // Include price for backend validation
        price: item.price,
      }));

      // ✅ FIX 5: Prepare complete order data
      const orderData = {
        items: itemsData,
        paymentMethod,
        transactionId: transactionId.trim().toUpperCase(), // Normalize to uppercase
        deliveryAddress: isDigitalOnly ? null : deliveryAddress,
        couponCode: appliedCoupon?.code || null,
        discountAmount: discountAmount || 0,
        notes: "", // Optional field
      };

      // ✅ FIX 6: Create order first
      const response = await axiosInstance.post("/orders", orderData);

      if (!response.data.success || !response.data.order?._id) {
        throw new Error("Failed to create order");
      }

      const orderId = response.data.order._id;

      // ✅ FIX 7: Upload screenshot immediately after order creation
      if (screenshot && screenshot.file) {
        const formData = new FormData();
        formData.append("screenshot", screenshot.file);
        formData.append("transactionId", transactionId.trim().toUpperCase());

        try {
          await axiosInstance.patch(
            `/orders/${orderId}/payment-proof`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 30000, // 30 second timeout
            },
          );
        } catch (uploadError) {
          console.error("Screenshot upload failed:", uploadError);
          // Don't fail the whole order if screenshot upload fails
          toast.error(
            "Order created but screenshot upload failed. Please contact support.",
          );
        }
      }

      // ✅ FIX 8: Handle course enrollments
      const courseItems = items.filter((item) => item.itemType === "course");
      if (courseItems.length > 0) {
        const enrollments = courseItems.map((item) => ({
          courseId: item.itemId,
          title: item.name,
          price: item.price,
          thumbnail: { url: item.image },
          instructor: {
            name: item.instructorName || "Unknown",
            _id: item.instructorId,
          },
          duration: item.duration,
          level: item.level,
          enrolledAt: new Date().toISOString(),
        }));

        dispatch(enrollMultipleCourses(enrollments));
      }

      // ✅ FIX 9: Clear applied coupon after successful order
      if (appliedCoupon) {
        dispatch(removeCoupon());
      }

      // ✅ FIX 10: Clear cart (optional - depends on your flow)
      // dispatch(clearCart());

      toast.success("Order placed successfully! Waiting for verification.");

      // ✅ FIX 11: Redirect based on order type
      const hasProduct = items.some((item) => item.itemType === "product");

      if (hasProduct) {
        navigate("/my-orders", {
          state: {
            message: "Order placed successfully! Track your order status here.",
            orderId: orderId,
          },
        });
      } else {
        navigate("/my-courses", {
          state: {
            message: "Enrollment successful! Start learning now.",
            orderId: orderId,
          },
        });
      }
    } catch (error) {
      console.error("Order submission error:", error);

      // ✅ FIX 12: Better error handling
      let errorMessage = "Failed to place order. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific error cases
      if (errorMessage.includes("transaction ID has already been used")) {
        toast.error(
          "This Transaction ID has already been used. Please check and enter a new one.",
        );
      } else if (errorMessage.includes("Insufficient stock")) {
        toast.error("Some items are out of stock. Please check your cart.");
      } else if (errorMessage.includes("Coupon")) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  const paymentMethods = [
    { id: "bkash", name: "bKash", color: "bg-pink-500" },
    { id: "nagad", name: "Nagad", color: "bg-orange-500" },
    { id: "rocket", name: "Rocket", color: "bg-purple-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coupon Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-sm border border-purple-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-purple-900">
              <Tag className="w-5 h-5 mr-2" />
              Have a Coupon?
            </h2>

            {appliedCoupon ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-green-900 text-sm sm:text-base truncate">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-xs sm:text-sm text-green-700 whitespace-nowrap">
                      {appliedCoupon.discountType === "percentage"
                        ? `${appliedCoupon.discountValue}% OFF`
                        : `${formatPrice(appliedCoupon.discountValue)} OFF`}
                    </p>
                  </div>
                </div>

                {/* রিমুভ বাটন */}
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-stretch gap-1.5 sm:gap-2 mb-4 w-full">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Coupon code..."
                      className="w-full h-full px-3 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase placeholder:text-xs sm:placeholder:text-sm"
                    />
                    {couponLoading && (
                      <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-600 animate-spin" />
                    )}
                  </div>

                  {/* অ্যাপ্লাই বাটন - ৩২০ পিক্সেল স্ক্রিনেও পাশাপাশি থাকবে */}
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponLoading}
                    className="px-4 sm:px-6 py-2.5 bg-purple-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                  >
                    Apply
                  </button>
                </div>

                {validationError && (
                  <p className="text-red-600 text-sm mb-3">{validationError}</p>
                )}

                {/* Available Coupons */}
                {availableCoupons.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowCouponList(!showCouponList)}
                      className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      {showCouponList ? "Hide" : "Show"} available coupons (
                      {availableCoupons.length})
                    </button>

                    {showCouponList && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon._id}
                            className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                            onClick={() => handleQuickApply(coupon.code)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-bold text-sm">
                                {coupon.code}
                              </code>
                              <span className="text-xs text-gray-500">
                                {coupon.discountType === "percentage"
                                  ? `${coupon.discountValue}% OFF`
                                  : `${formatPrice(coupon.discountValue)} OFF`}
                              </span>
                            </div>
                            {coupon.minPurchase > 0 && (
                              <p className="text-xs text-gray-600">
                                Min purchase: {formatPrice(coupon.minPurchase)}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Valid until:{" "}
                              {new Date(coupon.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Delivery Address */}
          {!isDigitalOnly && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Full Name"
                  value={deliveryAddress.fullName}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      fullName: e.target.value,
                    })
                  }
                  required
                />
                <InputField
                  label="Phone"
                  value={deliveryAddress.phone}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      phone: e.target.value,
                    })
                  }
                  required
                />
                <InputField
                  label="Address"
                  value={deliveryAddress.address}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      address: e.target.value,
                    })
                  }
                  required
                  className="md:col-span-2"
                />
                <InputField
                  label="City"
                  value={deliveryAddress.city}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      city: e.target.value,
                    })
                  }
                  required
                />
                <InputField
                  label="District"
                  value={deliveryAddress.district}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      district: e.target.value,
                    })
                  }
                  required
                />
                <InputField
                  label="Postal Code"
                  value={deliveryAddress.postalCode}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      postalCode: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Method
            </h2>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  // প্যাডিং অনেক কমিয়ে p-2 করা হয়েছে যাতে কম জায়গা নেয়
                  className={`p-2 sm:p-4 border-[1.5px] sm:border-2 rounded-lg text-center transition-all min-w-0 ${
                    paymentMethod === method.id
                      ? "border-purple-600 bg-purple-50 shadow-sm"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                >
                  {/* আইকনের সাইজ ছোট করা হয়েছে (w-7 h-7) */}
                  <div
                    className={`w-7 h-7 sm:w-10 sm:h-10 ${method.color} rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-[9px] sm:text-xs shrink-0`}
                  >
                    {method.name.slice(0, 2)}
                  </div>
                  {/* ফন্ট সাইজ আরও ছোট (text-[10px]) করা হয়েছে যাতে এক লাইনে আটে */}
                  <span className="font-semibold text-[10px] sm:text-sm block truncate leading-tight">
                    {method.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Send {formatPrice(finalAmount)} to the following number:
              </p>
              <p className="text-lg font-mono font-bold text-purple-600">
                01797475538
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Use reference: ORDER{Date.now().toString().slice(-6)}
              </p>
            </div>

            {/* ✅ FIXED: Transaction ID Input with validation */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  // Only allow alphanumeric, auto-uppercase, max 20 chars
                  const value = e.target.value
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .toUpperCase()
                    .slice(0, 20);
                  setTransactionId(value);
                }}
                placeholder="e.g., TRX123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase"
                required
                maxLength={20}
                minLength={5}
              />
              <p className="text-xs text-gray-500">
                Enter the Transaction ID from your {paymentMethod} payment
                SMS/app
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot (Optional)
              </label>
              <FileUploadButton
                onFileSelect={setScreenshot}
                accept="image/*"
                maxSize={5 * 1024 * 1024}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit sticky top-4">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          <div className="space-y-2 sm:space-y-3 mb-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {items.map((item) => (
              <div
                key={`${item.itemType}-${item.itemId}`}
                className="flex justify-between items-start gap-2 text-[13px] sm:text-sm border-b border-gray-50 pb-2 last:border-0"
              >
                <div className="text-gray-600 flex-1 min-w-0">
                  <p className="truncate sm:whitespace-normal">{item.name}</p>
                  <span className="text-gray-400 text-xs mt-0.5 block">
                    Qty: {item.quantity}
                  </span>
                </div>

                <span className="font-semibold text-gray-900 shrink-0 tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center gap-2 py-1 text-[13px] sm:text-sm">
              <span className="text-gray-600 font-medium">Subtotal</span>

              <span className="font-semibold text-gray-900 shrink-0 tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded">
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Discount {appliedCoupon && `(${appliedCoupon.code})`}
                </span>
                <span className="font-semibold">
                  -{formatPrice(discountAmount)}
                </span>
              </div>
            )}

            {appliedCoupon && (
              <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                You saved {formatPrice(discountAmount)} with this coupon!
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-200">
              <span>Total</span>
              <span className="text-purple-600">
                {formatPrice(finalAmount)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !transactionId}
            className="w-full mt-6 py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </button>

          {appliedCoupon && (
            <p className="text-xs text-center text-gray-500 mt-3">
              Coupon will be marked as used after order completion
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Checkout;
