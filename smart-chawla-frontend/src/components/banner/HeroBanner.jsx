import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useBanners } from "../../hooks/useBanners";

const HeroBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { banners, loading } = useBanners("hero");

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, banners.length]);

  if (loading || !Array.isArray(banners) || banners.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  return (
    <div
      className="relative w-full aspect-[16/9] sm:aspect-auto sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg bg-gray-100"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`absolute inset-0 transition-all duration-700 ${
            index === currentIndex
              ? "opacity-100 translate-x-0 z-10"
              : index < currentIndex
                ? "opacity-0 -translate-x-full z-0"
                : "opacity-0 translate-x-full z-0"
          }`}
        >
          {/* Background Image - Responsive & SEO Optimized */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={banner.image?.url}
              alt={banner.title || "Smart Chawla Special Offer"}
              fetchpriority={index === 0 ? "high" : "low"}
              srcSet={`
      ${banner.image?.mobileUrl || banner.image?.url} 640w,
      ${banner.image?.url} 1920w
    `}
              sizes="100vw"
              // width এবং height রিমুভ করে CSS দিয়ে কন্ট্রোল করা হয়েছে
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover sm:object-fill"
              style={{
                // ৩২০px এর মতো ছোট স্ক্রিনে ইমেজ যেন বিকৃত না হয়
                // তার জন্য object-position খুবই গুরুত্বপূর্ণ
                objectPosition: "center center",
              }}
            />

            {/* গ্রাডিয়েন্ট ওভারলে: এটি টেক্সট পড়ার সুবিধা দেবে */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl">
                <h2
                  className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 animate-fade-in-up leading-tight sm:leading-normal"
                  style={{
                    animationDelay: "0.2s",
                    wordBreak: "break-word",
                  }}
                >
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p
                    className="text-sm sm:text-lg md:text-xl text-gray-200 mb-4 sm:mb-8 animate-fade-in-up leading-relaxed max-w-[90%] sm:max-w-none line-clamp-2 sm:line-clamp-none"
                    style={{
                      animationDelay: "0.4s",
                      // ৩২০px এ টেক্সট যেন খুব বেশি জায়গা না নেয়
                    }}
                  >
                    {banner.subtitle}
                  </p>
                )}
                {banner.link && (
                  <Link
                    to={banner.link}
                    title={banner.buttonText || "Shop Now at Smart Chawla"}
                   className="inline-flex items-center justify-center px-5 py-2 sm:px-8 sm:py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all animate-fade-in-up text-xs sm:text-base min-w-[100px] sm:min-w-[140px] shadow-md hover:shadow-lg"
                    style={{ animationDelay: "0.6s",minHeight: "40px" }}
                  >
                    {banner.buttonText || "Shop Now"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-purple-600 w-6 sm:w-8"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
