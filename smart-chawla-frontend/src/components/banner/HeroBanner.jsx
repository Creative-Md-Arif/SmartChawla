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

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
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

  if (loading || banners.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg"
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
          <div className="absolute inset-0">
            <img
              src={banner.image?.url}
              alt={banner.title || "Hero banner"}
              srcSet={`
                ${banner.image?.mobileUrl || banner.image?.url} 640w,
                ${banner.image?.tabletUrl || banner.image?.url} 1024w,
                ${banner.image?.url} 1920w
              `}
              sizes="100vw"
              width={1920}
              height={600}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: "center center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p
                    className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 animate-fade-in-up"
                    style={{ animationDelay: "0.4s" }}
                  >
                    {banner.subtitle}
                  </p>
                )}
                {banner.link && (
                  <Link
                    to={banner.link}
                    className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors animate-fade-in-up text-sm sm:text-base"
                    style={{ animationDelay: "0.6s" }}
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