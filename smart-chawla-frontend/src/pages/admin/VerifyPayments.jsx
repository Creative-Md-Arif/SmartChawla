import { useState, useEffect } from 'react';
import { Check, X, Eye } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { formatPrice, formatDate } from '../../utils/formatters';
import PaymentScreenshotModal from '../../components/modals/PaymentScreenshotModal';

// ✅ All statuses from order model
const STATUS_CONFIG = {
  Pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  Verified: { color: 'bg-green-100 text-green-700', label: 'Verified' },
  Rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  Processing: { color: 'bg-blue-100 text-blue-700', label: 'Processing' },
  Shipped: { color: 'bg-purple-100 text-purple-700', label: 'Shipped' },
  Delivered: { color: 'bg-green-100 text-green-700', label: 'Delivered' },
  Completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
  Cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
};

const VerifyPayments = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
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
      // ✅ FIXED: Correct endpoints
      let endpoint = '/orders/admin/pending';
      let params = { page: pagination.page, limit: pagination.limit };

      if (activeTab === 'all') {
        // ✅ Use my-orders with status filter for all orders
        endpoint = '/orders/my-orders';
        // Optionally add status filter
      }

      const response = await axiosInstance.get(endpoint, { params });
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      console.error('Error verifying payment:', error);
      alert(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleReject = async (orderId, reason) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/reject`, { reason });
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert(error.response?.data?.message || 'Failed to reject payment');
    }
  };

  const getStatusColor = (status) => {
    return STATUS_CONFIG[status]?.color || 'bg-gray-100 text-gray-700';
  };

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'all', label: 'All Orders' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Verify Payments</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>{order.user?.fullName}</p>
                    <p className="text-sm text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatPrice(order.finalAmount)}</td>
                  <td className="px-6 py-4 capitalize">{order.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {order.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleVerify(order._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded ml-2"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder({ ...order, action: 'reject' })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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