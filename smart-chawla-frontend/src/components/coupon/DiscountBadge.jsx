import { TrendingDown, Tag } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const DiscountBadge = ({ originalPrice, discountPrice, discountAmount, size = 'md' }) => {
  const discountPercentage = originalPrice && discountPrice
    ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
    : 0;

  const savings = discountAmount || (originalPrice - (discountPrice || 0));

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (discountPercentage === 0 && savings === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      {/* Discount Percentage Badge */}
      {discountPercentage > 0 && (
        <span className={`inline-flex items-center bg-red-500 text-white font-bold rounded-full ${sizeClasses[size]}`}>
          <TrendingDown className={`${iconSizes[size]} mr-1`} />
          -{discountPercentage}%
        </span>
      )}

      {/* Savings Badge */}
      {savings > 0 && (
        <span className={`inline-flex items-center bg-green-500 text-white font-medium rounded-full ${sizeClasses[size]}`}>
          <Tag className={`${iconSizes[size]} mr-1`} />
          Save {formatPrice(savings)}
        </span>
      )}
    </div>
  );
};

export default DiscountBadge;
