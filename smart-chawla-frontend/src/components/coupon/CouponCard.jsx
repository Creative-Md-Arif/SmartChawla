import { useState } from 'react';
import { Copy, Check, Tag, Clock, Percent } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const CouponCard = ({ coupon, onApply }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isPercentage = coupon.discountType === 'percentage';
  const isExpiringSoon = new Date(coupon.validUntil) - new Date() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {isPercentage ? (
                <Percent className="w-5 h-5 text-white" />
              ) : (
                <Tag className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-2xl">
                {isPercentage ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
              </p>
              <p className="text-white/80 text-sm">OFF</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs">Code</p>
            <p className="text-white font-mono font-bold">{coupon.code}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {coupon.description && (
          <p className="text-gray-600 text-sm mb-3">{coupon.description}</p>
        )}

        {/* Terms */}
        <div className="space-y-2 text-sm text-gray-500">
          {coupon.minPurchase > 0 && (
            <p>Min. purchase: ৳{coupon.minPurchase}</p>
          )}
          {coupon.maxDiscount && (
            <p>Max discount: ৳{coupon.maxDiscount}</p>
          )}
          {coupon.usageLimit && (
            <p>Limited to {coupon.usageLimit} uses</p>
          )}
        </div>

        {/* Expiry */}
        <div className={`flex items-center mt-3 text-sm ${isExpiringSoon ? 'text-red-500' : 'text-gray-500'}`}>
          <Clock className="w-4 h-4 mr-1" />
          Expires {formatDate(coupon.validUntil)}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </>
            )}
          </button>
          {onApply && (
            <button
              onClick={() => onApply(coupon)}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
