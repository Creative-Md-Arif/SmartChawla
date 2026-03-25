import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { format } from 'date-fns';
import {
  Eye,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Truck,
  CreditCard,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Package,
  GraduationCap,
  Mail,
  Search,
  RefreshCw,
  Filter,
} from 'lucide-react';

// Status configurations
const STATUS_CONFIG = {
  Pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: CreditCard },
  Verified: { color: 'bg-green-100 text-green-800', label: 'Verified', icon: CheckCircle },
  Rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
  Processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing', icon: Package },
  Shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped', icon: Truck },
  Delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered', icon: CheckCircle },
  Completed: { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
  Cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
};

const PAYMENT_METHODS = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank Transfer',
  cash: 'Cash on Delivery',
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: '', type: 'success' }), 6000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      let endpoint = activeTab === 0 ? '/orders/admin/pending' : '/orders/my-orders';
      if (activeTab === 1 && statusFilter) params.status = statusFilter;

      const response = await axiosInstance.get(endpoint, { params });
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleViewDetails = async (orderId) => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setDetailOpen(true);
      }
    } catch (error) {
      showSnackbar('Failed to fetch order details', 'error');
    }
  };

  const handleVerifyPayment = async (orderId) => {
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/verify`);
      if (response.data.success) {
        showSnackbar('Payment verified successfully');
        fetchOrders();
        if (detailOpen) setSelectedOrder(response.data.order);
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to verify payment', 'error');
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      showSnackbar('Rejection reason must be at least 10 characters', 'error');
      return;
    }
    try {
      const response = await axiosInstance.patch(`/orders/${selectedOrder._id}/reject`, {
        reason: rejectReason.trim(),
      });
      if (response.data.success) {
        showSnackbar('Payment rejected successfully');
        setRejectDialogOpen(false);
        fetchOrders();
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to reject payment', 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const response = await axiosInstance.patch(`/orders/${orderId}/cancel`);
      if (response.data.success) {
        showSnackbar('Order cancelled successfully');
        fetchOrders();
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to cancel order', 'error');
    }
  };

  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab(0)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 0 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            Pending Orders {orders.some(o => o.status === 'Pending') && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {orders.filter(o => o.status === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 1 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            All Orders
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Order #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_CONFIG).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination({ ...pagination, limit: Number(e.target.value), page: 1 })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.orderNumber}</div>
                      {order.isDigital && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                          Digital
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{order.user?.fullName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{order.user?.email || order.user?.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{order.items?.length || 0} item(s)</div>
                      <div className="text-xs text-gray-500">
                        {order.items?.map(i => i.itemType).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{formatCurrency(order.finalAmount)}</div>
                      {order.discountAmount > 0 && (
                        <div className="text-xs text-green-600">-{formatCurrency(order.discountAmount)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs border">
                        {PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}
                      </span>
                      {order.transactionId && (
                        <div className="text-xs text-gray-500 mt-1">
                          TXN: {order.transactionId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      <div className="text-xs">{format(new Date(order.createdAt), 'HH:mm')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(order._id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleVerifyPayment(order._id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Verify Payment"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setRejectReason('');
                                setRejectDialogOpen(true);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject Payment"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="Cancel Order"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setPagination({ ...pagination, page })}
              className={`px-3 py-1 rounded ${
                page === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h2>
              <StatusBadge status={selectedOrder.status} />
            </div>
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount {selectedOrder.couponCode && `(${selectedOrder.couponCode})`}</span>
                        <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-blue-600">{formatCurrency(selectedOrder.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method</span>
                      <span>{PAYMENT_METHODS[selectedOrder.paymentMethod]}</span>
                    </div>
                    {selectedOrder.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="font-mono text-xs">{selectedOrder.transactionId}</span>
                      </div>
                    )}
                    {selectedOrder.paymentScreenshot?.url && (
                      <button
                        onClick={() => {
                          setPreviewImage(selectedOrder.paymentScreenshot.url);
                          setImagePreviewOpen(true);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
                      >
                        <ImageIcon size={16} />
                        View Screenshot
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span>{selectedOrder.user?.fullName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span>{selectedOrder.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span>{selectedOrder.user?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{format(new Date(selectedOrder.createdAt), 'PPP')}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {!selectedOrder.isDigital && selectedOrder.deliveryAddress && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin size={18} />
                    Delivery Address
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.deliveryAddress.fullName}</p>
                    <p>{selectedOrder.deliveryAddress.phone}</p>
                    <p className="text-gray-600">
                      {selectedOrder.deliveryAddress.address}, {selectedOrder.deliveryAddress.city},{' '}
                      {selectedOrder.deliveryAddress.district} - {selectedOrder.deliveryAddress.postalCode}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items ({selectedOrder.items?.length || 0})</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {item.itemType === 'course' ? <GraduationCap size={20} /> : <Package size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.itemType === 'course' ? 'Course' : 'Product'} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.priceAtPurchase * item.quantity)}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(item.priceAtPurchase)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.statusHistory?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Status History</h3>
                  <div className="space-y-2">
                    {selectedOrder.statusHistory.map((record, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <StatusBadge status={record.status} />
                        <span className="text-gray-500">
                          {format(new Date(record.changedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {record.note && <span className="text-gray-600">- {record.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-1 text-blue-900">Customer Notes</h3>
                  <p className="text-blue-800">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              {selectedOrder.status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectDialogOpen(true);
                      setDetailOpen(false);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Reject Payment
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Verify Payment
                  </button>
                </>
              )}
              <button
                onClick={() => setDetailOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Reject Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Order: {selectedOrder?.orderNumber}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejection (minimum 10 characters)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1">{rejectReason.length} characters (min 10)</p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectDialogOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={rejectReason.trim().length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setImagePreviewOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <XCircle size={24} />
            </button>
            <img
              src={previewImage}
              alt="Payment Screenshot"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          snackbar.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
};

export default ManageOrders;