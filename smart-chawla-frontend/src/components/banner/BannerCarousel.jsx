import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const BannerCarousel = ({ banners, itemsPerView = 3, autoPlay = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});

  const maxIndex = Math.max(0, banners.length - itemsPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (!autoPlay || isPaused || banners.length <= itemsPerView) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [autoPlay, isPaused, nextSlide, banners.length, itemsPerView]);

  const handleImageLoad = (id) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  if (banners.length === 0) return null;

  return (
    <div
      className="relative w-full group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container - SEO & Responsive Friendly */}
      <div className="overflow-hidden rounded-xl sm:rounded-2xl shadow-sm">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] touch-pan-x"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="flex-shrink-0 w-full px-0.5 sm:px-2"
              style={{
                width: `${100 / itemsPerView}%`,
              }}
            >
              <Link
                to={banner.link} // Link component for client-side routing
                className="block relative overflow-hidden group/item"
                title={banner.title}
              >
                {/* 100% responsive aspect ratio */}
                <div className="aspect-[21/9] xs:aspect-[16/9] sm:aspect-auto sm:h-[350px] relative bg-neutral-200">
                  {/* High Priority Skeleton Loader */}
                  {!loadedImages[banner._id] && (
                    <div className="absolute inset-0 bg-neutral-200 animate-pulse z-10 flex items-center justify-center">
                      <div
                        className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
                        style={{ backgroundSize: "200% 100%" }}
                      />
                    </div>
                  )}

                  <img
                    src={banner.image?.url}
                    alt={banner.title || "Promotion"}
                    loading="lazy"
                    onLoad={() => handleImageLoad(banner._id)}
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-105 ${
                      loadedImages[banner._id] ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  {/* Subtle SEO Friendly Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 translate-y-0 group-hover/item:-translate-y-1 transition-transform duration-500">
                    <h3 className="text-white font-bold text-sm sm:text-2xl line-clamp-1 font-bangla drop-shadow-lg tracking-tight">
                      {banner.title}
                    </h3>
                    {/* Optional: Add a small indicator for interactivity */}
                    <div className="w-8 h-1 bg-purple-500 mt-2 rounded-full scale-x-0 group-hover/item:scale-x-100 transition-transform origin-left duration-500" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots - Only Navigation left */}
      {banners.length > itemsPerView && (
        <div className="flex justify-center mt-3 sm:mt-4 space-x-1.5 sm:space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-purple-600 w-5 sm:w-10"
                  : "bg-neutral-300 w-1.5 sm:w-2 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
