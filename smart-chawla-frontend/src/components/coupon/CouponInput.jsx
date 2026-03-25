import { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { useCoupons } from '../../hooks/useCoupons';

const CouponInput = ({ subtotal, onApply, onRemove, appliedCoupon }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { validateCoupon } = useCoupons();

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await validateCoupon(code, subtotal);
      if (result.valid) {
        onApply?.(result);
        setCode('');
      } else {
        setError(result.reason || 'Invalid coupon code');
      }
    } catch (err) {
      setError('Failed to validate coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    onRemove?.();
    setCode('');
    setError('');
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">
                Coupon Applied: {appliedCoupon.couponCode}
              </p>
              <p className="text-sm text-green-600">
                You saved ৳{appliedCoupon.discount}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Have a coupon?
      </label>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || isLoading}
          className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Apply'
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default CouponInput;
