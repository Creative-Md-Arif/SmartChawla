import { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useBanners } from '../../hooks/useBanners';

const PromoBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { banners } = useBanners('promo');

  if (isDismissed || banners.length === 0) return null;

  const banner = banners[0]; // Show first promo banner

  return (
    <div
      className="relative w-full py-3 px-4"
      style={{
        background: banner.backgroundColor || 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Tag className="w-5 h-5 text-white" />
          <p
            className="text-white font-medium"
            style={{ color: banner.textColor || '#ffffff' }}
          >
            {banner.title}
          </p>
          {banner.link && (
            <a
              href={banner.link}
              className="text-sm underline hover:no-underline"
              style={{ color: banner.textColor || '#ffffff' }}
            >
              Learn More
            </a>
          )}
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;
