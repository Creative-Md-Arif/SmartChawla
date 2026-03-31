import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Eye,
  XCircle,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { formatPrice, formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await axiosInstance.get("/orders/my-orders", { params });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // 🔴 [NEW] Cancel order handler
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/cancel`);
      if (response.data.success) {
        toast.success("Order cancelled successfully");
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  // 🔴 [NEW] Toggle order details expansion
  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // 🔴 [UPDATED] Status colors with better design
  const getStatusConfig = (status) => {
    const configs = {
      Pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
        label: "Pending Payment Verification",
      },
      Verified: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Payment Verified",
      },
      Rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Payment Rejected",
      },
      Processing: {
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Package className="w-4 h-4" />,
        label: "Processing",
      },
      Shipped: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Truck className="w-4 h-4" />,
        label: "Shipped",
      },
      Delivered: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <MapPin className="w-4 h-4" />,
        label: "Delivered",
      },
      Completed: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Completed",
      },
      Cancelled: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <XCircle className="w-4 h-4" />,
        label: "Cancelled",
      },
    };
    return configs[status] || configs.Pending;
  };

  // 🔴 [UPDATED] All filters including new statuses
  const filters = [
    { key: "all", label: "All Orders" },
    { key: "Pending", label: "Pending" },
    { key: "Verified", label: "Verified" },
    { key: "Processing", label: "Processing" },
    { key: "Shipped", label: "Shipped" },
    { key: "Delivered", label: "Delivered" },
    { key: "Completed", label: "Completed" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  // 🔴 [NEW] Render progress steps
  const renderProgressSteps = (status) => {
    const steps = [
      "Pending",
      "Verified",
      "Processing",
      "Shipped",
      "Delivered",
      "Completed",
    ];
    const currentIndex = steps.indexOf(status);

    if (currentIndex === -1 || status === "Cancelled" || status === "Rejected")
      return null;

    return (
      <div className="mt-8 mb-6 px-1">
        <div className="flex items-center justify-between relative w-full">
          {/* Progress bar background */}
          <div className="absolute left-0 right-0 top-[5px] h-[3px] bg-gray-200 -translate-y-1/2 rounded-full"></div>

          {/* Active progress */}
          <div
            className="absolute left-0 top-[5px] h-[3px] bg-purple-600 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>

          {/* Steps mapping */}
          {steps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center"
              >
                {/* Dot Indicator */}
                <div
                  className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "bg-purple-600 border-purple-600"
                      : "bg-white border-gray-300"
                  } ${isCurrent ? "ring-2 ring-purple-300 ring-offset-1" : ""}`}
                ></div>

                {/* Step Text: ৩২০ পিক্সেলের জন্য স্পেশাল হ্যান্ডেলিং */}
                <div className="absolute top-4 w-12 flex justify-center">
                  <span
                    className={`
               text-[8px] sm:text-[10px] text-center leading-[1.1]
               ${isActive ? "text-purple-700 font-bold" : "text-gray-400 font-medium"}
               break-words
             `}
                  >
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 🔴 [NEW] Render shipping info
  const renderShippingInfo = (order) => {
    if (!order.trackingNumber && !order.shippingProvider) return null;

    return (
      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
        <h4 className="font-medium text-purple-900 mb-2 flex items-center">
          <Truck className="w-4 h-4 mr-2" />
          Shipping Information
        </h4>
        <div className="space-y-1 text-sm">
          {order.shippingProvider && (
            <p>
              <span className="text-gray-600">Provider:</span>{" "}
              {order.shippingProvider}
            </p>
          )}
          {order.trackingNumber && (
            <p className="font-mono bg-white px-2 py-1 rounded border inline-block">
              <span className="text-gray-600">Tracking:</span>{" "}
              {order.trackingNumber}
            </p>
          )}
          {order.estimatedDelivery && (
            <p>
              <span className="text-gray-600">Estimated Delivery:</span>{" "}
              {formatDate(order.estimatedDelivery)}
            </p>
          )}
          {order.deliveredAt && (
            <p className="text-green-700 font-medium">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Delivered on {formatDate(order.deliveredAt)}
            </p>
          )}
        </div>
      </div>
    );
  };

  // 🔴 [NEW] Render delivery address
  const renderDeliveryAddress = (order) => {
    if (order.isDigital) {
      return (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Digital Product - Instant access after verification
          </p>
        </div>
      );
    }

    if (!order.deliveryAddress) return null;

    const { fullName, phone, address, city, district, postalCode } =
      order.deliveryAddress;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Delivery Address
        </h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-medium">{fullName}</p>
          <p>{phone}</p>
          <p>{address}</p>
          <p>
            {city}, {district} {postalCode && `- ${postalCode}`}
          </p>
        </div>
      </div>
    );
  };

  // 🔴 [NEW] Render payment info
  const renderPaymentInfo = (order) => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <CreditCard className="w-4 h-4 mr-2" />
          Payment Information
        </h4>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-gray-600">Method:</span>{" "}
            <span className="capitalize">{order.paymentMethod}</span>
          </p>
          {order.transactionId && (
            <p className="font-mono text-xs bg-white px-2 py-1 rounded border inline-block">
              Transaction ID: {order.transactionId}
            </p>
          )}
          {order.discountAmount > 0 && (
            <p className="text-green-600">
              Discount: {formatPrice(order.discountAmount)}
              {order.couponCode && `(Code: ${order.couponCode})`}
            </p>
          )}
          {order.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <strong>Rejection Reason:</strong> {order.rejectionReason}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="px-1 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          My Orders
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Track and manage your orders
        </p>
      </div>

      {/* 🔴 [UPDATED] Filter buttons with better design */}
      <div className="relative mb-6">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                filter === f.key
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No orders found</p>
          <p className="text-gray-400 text-sm mb-6">
            {filter !== "all"
              ? `No ${filter} orders found`
              : "Start shopping to see your orders here"}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const isExpanded = expandedOrder === order._id;

            return (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
              >
                {/* Order Header */}
                <div className="p-6">
                  {/* Main Container: ৩২০ পিক্সেলে গ্যাপ এবং প্যাডিং ঠিক করা হয়েছে */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    {/* Left/Top Section: Order Icon, Number, Date, Type */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Icon: ৩২০ পিক্সেলে সাইজ কিছুটা ছোট (w-10 h-10) করা হয়েছে */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>

                      {/* Order Details: ৩২০ পিক্সেলের জন্য টেক্সট সাইজ এবং এলাইনমেন্ট */}
                      <div className="flex-1 min-w-0">
                        {/* Order Number: বড় ফন্টে স্পষ্ট দেখাবে, truncate ব্যবহার করা হয়েছে */}
                        <p className="font-bold text-gray-900 text-sm sm:text-lg truncate">
                          #{order.orderNumber}
                        </p>

                        {/* Date and Type: ছোট ফন্টে এক লাইনে রাখা হয়েছে */}
                        <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">
                          Placed on {formatDate(order.createdAt)} •{" "}
                          {order.isDigital ? "Digital" : "Physical"}
                        </p>

                        <p className="text-[11px] sm:text-sm text-gray-600 mt-1">
                          {order.items?.length || 0} item(s) total
                        </p>
                      </div>
                    </div>

                    {/* Right/Bottom Section: Status Badge and Total Amount */}
                    <div className="flex flex-col xs:flex-row items-start xs:items-center md:flex-col md:items-end gap-3 xs:gap-4 md:gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {/* Status Badge: ৩২০ পিক্সেলে w-fit দিয়ে লেখা অনুযায়ী ছোট রাখা হয়েছে */}
                      <div className="w-fit flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {order.status}
                        </span>
                      </div>

                      {/* Total Amount: বড় এবং উজ্জ্বল কালারে দেখানো হয়েছে */}
                      <div className="text-left md:text-right mt-1 md:mt-0 flex-shrink-0">
                        <p className="text-[10px] sm:text-sm text-gray-400 uppercase tracking-wide">
                          Total Amount
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-purple-600 leading-tight">
                          {formatPrice(order.finalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 🔴 [NEW] Progress Steps */}
                  {renderProgressSteps(order.status)}

                  {/* Action Buttons */}
                  <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-2 mt-4 pt-4 border-t">
                    {/* View/Hide Details Button */}
                    <button
                      onClick={() => toggleExpand(order._id)}
                      className="flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full xs:w-auto min-h-[44px]"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            Hide Details
                          </span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            View Details
                          </span>
                        </>
                      )}
                    </button>

                    {/* Cancel Order Button */}
                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancelling}
                        className="flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 w-full xs:w-auto min-h-[44px]"
                      >
                        <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {cancelling ? "Cancelling..." : "Cancel Order"}
                        </span>
                      </button>
                    )}

                    {/* Track Order Button */}
                    {order.status === "Shipped" && order.trackingNumber && (
                      <a
                        href={`https://track.pathao.com/tracking?trackingId=${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors w-full xs:w-auto min-h-[44px]"
                      >
                        <Truck className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="whitespace-nowrap">Track Order</span>
                      </a>
                    )}

                    {/* Access Course Button */}
                    {order.isDigital &&
                      (order.status === "Verified" ||
                        order.status === "Completed") && (
                        <Link
                          to="/my-courses"
                          className="flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors w-full xs:w-auto min-h-[44px]"
                        >
                          <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            Access Course
                          </span>
                        </Link>
                      )}
                  </div>
                </div>

                {/* 🔴 [NEW] Expandable Details Section */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-6 animate-in slide-in-from-top-2">
                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Order Items
                      </h4>
                      <div className="space-y-3">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-white p-3 rounded-lg"
                          >
                            <img
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              loading="lazy"
                              // এটি মেইন কন্টেন্ট নয়, তাই লোড প্রায়োরিটি কম রাখা হয়েছে
                              fetchpriority="high"
                            />
                            <div className="ml-4 flex-1">
                              <p className="font-medium text-gray-900">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                {item.itemType}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.quantity} ×{" "}
                                {formatPrice(item.priceAtPurchase)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(
                                  item.priceAtPurchase * item.quantity,
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Info */}
                    {renderPaymentInfo(order)}

                    {/* Shipping Info */}
                    {renderShippingInfo(order)}

                    {/* Delivery Address */}
                    {renderDeliveryAddress(order)}

                    {/* Status History */}
                    {order.statusHistory?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Order Timeline
                        </h4>
                        <div className="space-y-2">
                          {order.statusHistory.map((record, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 text-sm"
                            >
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5"></div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {record.status}
                                </p>
                                <p className="text-gray-500">
                                  {formatDate(record.changedAt)}
                                  {record.note && ` - ${record.note}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
