import { Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import {
  Grid3X3,
  ArrowRight,
  FolderOpen,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Package,
} from "lucide-react";
import { useState } from "react";

const CategoryList = () => {
  const { categories, loading, error, refetch } = useCategories({ tree: true });
  const [hoveredId, setHoveredId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState({});

  // Skeleton Loading Component
  const CategorySkeleton = () => (
    <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
      <div className="h-48 bg-neutral-100 animate-pulse relative">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>
      <div className="p-6 space-y-3">
        <div className="h-6 bg-neutral-100 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-neutral-100 rounded-lg w-1/2 animate-pulse" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-neutral-100 rounded w-full animate-pulse" />
          <div className="h-3 bg-neutral-100 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </div>
  );

  // Error State
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-premium border border-rose-100 p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2 font-bangla">
            ক্যাটাগরি লোড করতে সমস্যা
          </h3>
          <p className="text-neutral-500 text-sm mb-6">
            {error.message ||
              "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"}
          </p>
          <button
            onClick={refetch}
            className="inline-flex items-center px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-300 shadow-lg hover:shadow-glow"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="font-bangla">আবার চেষ্টা করুন</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 bg-neutral-100 rounded-xl w-64 animate-pulse" />
          <div className="h-8 bg-neutral-100 rounded-lg w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 font-bangla">
              সব ক্যাটাগরি
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              মোট {categories.length}টি ক্যাটাগরি পাওয়া গেছে
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-neutral-500 bg-neutral-50 px-4 py-2 rounded-full border border-neutral-100">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span className="font-bangla">নতুন পণ্য যোগ হচ্ছে প্রতিদিন</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const isHovered = hoveredId === category._id;
          const hasImage = !!category.featuredImage?.url;

          return (
            <div
              key={category._id}
              className={`
                group relative bg-white rounded-2xl shadow-soft border border-neutral-100 
                overflow-hidden transition-all duration-500 ease-out
                hover:shadow-premium hover:border-primary-200 hover:-translate-y-1
              `}
              onMouseEnter={() => setHoveredId(category._id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image Section */}
              <Link
                to={`/category/${category.slug}`}
                className="relative block h-48 overflow-hidden"
              >
                <div className="absolute inset-0 bg-neutral-50">
                  {!imageLoaded[category._id] && hasImage && (
                    <div className="absolute inset-0 bg-neutral-100 animate-pulse">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                        style={{ backgroundSize: "200% 100%" }}
                      />
                    </div>
                  )}

                  {hasImage ? (
                    <img
                      src={category.featuredImage.url}
                      alt={category.name.en}
                      loading="lazy"
                      fetchpriority="high"
                      onLoad={() =>
                        setImageLoaded((prev) => ({
                          ...prev,
                          [category._id]: true,
                        }))
                      }
                      className={`
                        w-full h-full object-cover transition-all duration-700 ease-out
                        ${isHovered ? "scale-110" : "scale-100"}
                        ${imageLoaded[category._id] ? "opacity-100" : "opacity-0"}
                      `}
                    />
                  ) : (
                    <div
                      className={`
                      w-full h-full flex items-center justify-center transition-colors duration-300
                      ${isHovered ? "bg-primary-50" : "bg-neutral-50"}
                    `}
                    >
                      <div
                        className={`
                        p-6 rounded-2xl transition-all duration-500
                        ${isHovered ? "bg-primary-100 scale-110" : "bg-neutral-100"}
                      `}
                      >
                        <Grid3X3
                          className={`
                          w-12 h-12 transition-colors duration-300
                          ${isHovered ? "text-primary-500" : "text-neutral-300"}
                        `}
                        />
                      </div>
                    </div>
                  )}

                  {/* Overlay Gradient */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-neutral-900/10 to-transparent
                    transition-opacity duration-500
                    ${isHovered ? "opacity-100" : "opacity-0"}
                  `}
                  />

                  {/* Product Count Badge */}
                  <div
                    className={`
                    absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-neutral-700 
                    text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center
                    transition-all duration-300
                    ${isHovered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
                  `}
                  >
                    <Package className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
                    {category.productCount || 0} পণ্য
                  </div>
                </div>
              </Link>

              {/* Content Section */}
              <div className="p-6">
                <Link to={`/category/${category.slug}`}>
                  <h2
                    className={`
                    text-xl font-semibold text-neutral-800 font-bangla mb-1
                    transition-colors duration-300
                    ${isHovered ? "text-primary-600" : ""}
                  `}
                  >
                    {category.name.bn || category.name.en}
                  </h2>
                </Link>

                <p className="text-sm text-neutral-500 mb-4">
                  {category.description?.bn ||
                    category.description?.en ||
                    "বিভিন্ন ধরনের পণ্য পাবেন এই ক্যাটাগরিতে"}
                </p>

                {/* Sub-categories */}
                {category.subCategories?.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {category.subCategories.slice(0, 4).map((sub) => (
                        <Link
                          key={sub._id}
                          to={`/category/${sub.slug}`}
                          className={`
                            text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                            bg-neutral-50 text-neutral-600 border-neutral-200
                            hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200
                          `}
                        >
                          {sub.name.bn || sub.name.en}
                        </Link>
                      ))}
                      {category.subCategories.length > 4 && (
                        <span className="text-xs px-3 py-1.5 text-neutral-400">
                          +{category.subCategories.length - 4} আরও
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA Link */}
                <Link
                  to={`/category/${category.slug}`}
                  className={`
                    inline-flex items-center text-sm font-medium transition-all duration-300 group/link
                    ${isHovered ? "text-primary-600" : "text-neutral-600"}
                  `}
                >
                  <span
                    className={`
                    relative font-bangla
                    ${isHovered ? "translate-x-0" : ""}
                  `}
                  >
                    সব পণ্য দেখুন
                  </span>
                  <ArrowRight
                    className={`
                    w-4 h-4 ml-2 transition-all duration-300
                    ${isHovered ? "translate-x-1 text-primary-500" : ""}
                  `}
                  />

                  {/* Underline animation */}
                  <span
                    className={`
                    absolute bottom-0 left-0 h-0.5 bg-primary-500 transition-all duration-300
                    ${isHovered ? "w-full" : "w-0"}
                  `}
                  />
                </Link>
              </div>

              {/* Hover Glow Effect */}
              <div
                className={`
                absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500
                ${isHovered ? "opacity-100" : "opacity-0"}
              `}
              >
                <div className="absolute inset-0 rounded-2xl ring-2 ring-primary-200 ring-offset-2" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-10 h-10 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2 font-bangla">
            কোনো ক্যাটাগরি পাওয়া যায়নি
          </h3>
          <p className="text-neutral-500">অনুগ্রহ করে পরে আবার চেষ্টা করুন</p>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
