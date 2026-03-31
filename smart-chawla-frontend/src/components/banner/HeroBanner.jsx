import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useBanners } from "../../hooks/useBanners";

const HeroBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { banners, loading } = useBanners("hero");

  const nextSlide = useCallback(() => {
    if (banners?.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }
  }, [banners?.length]);

  useEffect(() => {
    if (!isAutoPlaying || !banners || banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, banners?.length]);

  // ১. Skeleton/Loading State: আসল কন্টেইনারের সমান হাইট রাখুন
  if (loading || !banners || banners.length === 0) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  return (
    <div
      // ২. Aspect Ratio এবং নির্দিষ্ট হাইট সেট করা (CLS রোধে)
      className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg bg-gray-100 shadow-sm"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {banners.map((banner, index) => {
        // ৩. Cloudinary URL Optimization (ম্যানুয়ালি f_auto, q_auto যোগ করা)
        const optimizedUrl = banner.image?.url?.replace("/upload/", "/upload/f_auto,q_auto,w_1200/");
        const optimizedMobileUrl = (banner.image?.mobileUrl || banner.image?.url)?.replace("/upload/", "/upload/f_auto,q_auto,w_600/");

        return (
          <div
            key={banner._id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div className="absolute inset-0">
              <img
                src={optimizedUrl}
                srcSet={`${optimizedMobileUrl} 600w, ${optimizedUrl} 1200w`}
                sizes="100vw"
                alt={banner.title || "Offer"}
                // ৪. প্রথম ইমেজের জন্য হাই প্রায়োরিটি
                loading={index === 0 ? "eager" : "lazy"}
                fetchpriority={index === 0 ? "high" : "low"}
                className="w-full h-full object-cover"
                // ৫. ডিকোড করার সময় মেইন থ্রেড ব্লক করবে না
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl">
                  <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="text-sm sm:text-lg text-gray-100 mb-8 line-clamp-2">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link && (
                    <Link
                      to={banner.link}
                      className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {banner.buttonText || "Shop Now"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-white w-6" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;