import { useState } from "react";
import { X, Check, XCircle, ZoomIn, ZoomOut, Download } from "lucide-react";
import { formatPrice, formatDate } from "../../utils/formatters";

const PaymentScreenshotModal = ({ order, onClose, onVerify, onReject }) => {
  const [zoom, setZoom] = useState(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) return null;

  const handleVerify = async () => {
    setIsProcessing(true);
    await onVerify(order._id);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    await onReject(order._id, rejectionReason);
    setIsProcessing(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Payment Verification - {order.orderNumber}
            </h2>
            <p className="text-sm text-gray-500">
              Submitted on {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row">
          {/* Screenshot Viewer */}
          <div className="flex-1 bg-gray-900 p-4 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white text-sm">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
              <a
                href={order.paymentScreenshot?.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </div>

            {/* Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center">
              {order.paymentScreenshot?.url ? (
                <img
                  src={order.paymentScreenshot.url}
                  alt="Payment Screenshot"
                  loading="lazy"
                  fetchpriority="high"
                  className="max-w-full transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <div className="text-white text-center">
                  <p>No screenshot available</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{order.user?.fullName}</p>
                <p className="text-sm text-gray-500">{order.user?.email}</p>
                <p className="text-sm text-gray-500">{order.user?.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium font-mono">{order.transactionId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{order.paymentMethod}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-lg text-purple-600">
                  {formatPrice(order.finalAmount)}
                </p>
                {order.discountAmount > 0 && (
                  <p className="text-sm text-gray-500">
                    Discount: {formatPrice(order.discountAmount)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Items</p>
                <ul className="mt-1 space-y-1">
                  {order.items?.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item.name} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {order.notes && (
                <div>
                  <p className="text-sm text-gray-500">Customer Notes</p>
                  <p className="text-sm bg-white p-2 rounded border">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Status History */}
            {order.statusHistory?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  Status History
                </h4>
                <div className="space-y-2">
                  {order.statusHistory.map((status, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{status.status}</span>
                      <span className="text-gray-500 ml-2">
                        {formatDate(status.changedAt)}
                      </span>
                      {status.note && (
                        <p className="text-gray-500 text-xs">{status.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {showRejectForm ? (
            <div className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isProcessing}
                className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Reject
              </button>
              <button
                onClick={handleVerify}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check className="w-5 h-5 mr-2" />
                {isProcessing ? "Processing..." : "Verify Payment"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentScreenshotModal;
