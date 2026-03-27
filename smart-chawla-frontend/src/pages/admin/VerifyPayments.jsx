import { useState, useEffect } from "react";
import {
  Check,
  X,
  Eye,
  ChevronRight,
  Home,
  Store,
  Menu,
  Loader2,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { formatPrice, formatDate } from "../../utils/formatters";
import PaymentScreenshotModal from "../../components/modals/PaymentScreenshotModal";
import AdminSidebar from "../admin/AdminSidebar"
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  Pending: { color: "bg-amber-100 text-amber-700", label: "Pending" },
  Verified: { color: "bg-green-100 text-green-700", label: "Verified" },
  Rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
  Processing: { color: "bg-blue-100 text-blue-700", label: "Processing" },
  Shipped: { color: "bg-purple-100 text-purple-700", label: "Shipped" },
  Delivered: { color: "bg-green-100 text-green-700", label: "Delivered" },
  Completed: { color: "bg-emerald-100 text-emerald-700", label: "Completed" },
  Cancelled: { color: "bg-gray-100 text-gray-700", label: "Cancelled" },
};

const breadcrumbs = [
  { label: "Dashboard", labelBn: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "Payments", labelBn: "পেমেন্টস", path: "/admin/payments" },
  
];

const VerifyPayments = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [activeTab, pagination.page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let endpoint = "/orders/admin/pending";
      let params = { page: pagination.page, limit: pagination.limit };
      if (activeTab === "all") endpoint = "/orders/my-orders";
      const response = await axiosInstance.get(endpoint, { params });
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (orderId) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/verify`);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert(error.response?.data?.message || "Failed to verify payment");
    }
  };

  const handleReject = async (orderId, reason) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/reject`, { reason });
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert(error.response?.data?.message || "Failed to reject payment");
    }
  };

  const getStatusColor = (status) =>
    STATUS_CONFIG[status]?.color || "bg-gray-100 text-gray-700";

  const tabs = [
    { id: "pending", label: "Pending Verification", labelBn: "অপেক্ষমাণ" },
    { id: "all", label: "All Orders", labelBn: "সব অর্ডার" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Mobile Header */}
      <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SmartChawla</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 xl:ml-0 mt-16 xl:mt-0">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-4 text-sm">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <Link
                    to={crumb.path}
                    className={`flex items-center gap-1.5 ${idx === breadcrumbs.length - 1 ? "text-violet-700 font-medium" : "text-gray-500 hover:text-violet-600"}`}
                  >
                    {idx === 0 && <Home className="w-4 h-4" />}
                    <span>{crumb.labelBn}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Verify Payments
            </h1>
            <p className="text-sm text-gray-500 mt-1">পেমেন্ট ভেরিফিকেশন</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="block">{tab.label}</span>
                <span className="text-xs opacity-70">{tab.labelBn}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium">No orders found</p>
              <p className="text-sm text-gray-500 mt-1">
                কোন অর্ডার পাওয়া যায়নি
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Order
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-violet-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">
                            {order.user?.fullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.user?.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatPrice(order.finalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-gray-700 bg-gray-100 px-2 py-1 rounded-lg text-sm">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                              title="View Screenshot"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {order.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleVerify(order._id)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Verify"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedOrder({
                                      ...order,
                                      action: "reject",
                                    })
                                  }
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page - 1 }))
                      }
                      disabled={pagination.page === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page + 1 }))
                      }
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <PaymentScreenshotModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default VerifyPayments;
