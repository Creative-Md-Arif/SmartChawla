import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  X,
  SlidersHorizontal,
  Search,
  ShoppingBag,
  ChevronRight,
  Home,
  LayoutGrid,
} from "lucide-react";
import ProductCard from "../../components/cards/ProductCard";
import CategorySidebar from "../../components/category/CategorySidebar";
import axiosInstance from "../../utils/axiosInstance";
import { ProductCardSkeleton } from "../../components/common/Loader";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State Management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState([]);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("-createdAt");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Get URL params
  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";
  const pageParam = parseInt(searchParams.get("page")) || 1;

  // Fetch categories for names
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/categories");
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Initialize filters from URL
  useEffect(() => {
    const cats =
      searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sort = searchParams.get("sort") || "-createdAt";
    const stock = searchParams.get("inStock") === "true";
    const featured = searchParams.get("isFeatured") === "true";

    setSelectedCategories(cats);
    setPriceRange({ min: minPrice, max: maxPrice });
    setSortBy(sort);
    setInStockOnly(stock);
    setIsFeatured(featured);
    setPagination((prev) => ({ ...prev, page: pageParam }));
  }, [searchParams]);

  // Update selected category names when categories or selection changes
  useEffect(() => {
    const names = selectedCategories.map((catId) => {
      const cat = categories.find((c) => c._id === catId);
      return cat?.name?.bn || cat?.name?.en || "Unknown";
    });
    setSelectedCategoryNames(names);
  }, [selectedCategories, categories]);

  // Fetch Products with Filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
      };

      // Add filters to params
      if (searchQuery) params.search = searchQuery;
      if (selectedCategories.length > 0)
        params.category = selectedCategories.join(",");
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;
      if (inStockOnly) params.inStock = "true";
      if (isFeatured) params.isFeatured = "true";

      const response = await axiosInstance.get("/products", { params });

      setProducts(response.data.products || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    selectedCategories,
    priceRange,
    sortBy,
    inStockOnly,
    isFeatured,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL with filters
  const updateURL = useCallback(
    (newFilters) => {
      const params = new URLSearchParams();

      if (searchQuery) params.set("search", searchQuery);
      if (newFilters.categories?.length > 0)
        params.set("categories", newFilters.categories.join(","));
      if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
      if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
      if (newFilters.sort && newFilters.sort !== "-createdAt")
        params.set("sort", newFilters.sort);
      if (newFilters.inStock) params.set("inStock", "true");
      if (newFilters.isFeatured) params.set("isFeatured", "true");
      if (newFilters.page > 1) params.set("page", newFilters.page.toString());

      setSearchParams(params);
    },
    [searchQuery, setSearchParams],
  );

  // Filter Handlers
  const handleCategoryChange = (categories) => {
    setSelectedCategories(categories);
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({
      categories,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      inStock: inStockOnly,
      isFeatured: isFeatured,
      page: 1,
    });
  };

  const handlePriceChange = (type, value) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
  };

  const applyPriceFilter = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({
      categories: selectedCategories,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      inStock: inStockOnly,
      isFeatured: isFeatured,
      page: 1,
    });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    updateURL({
      categories: selectedCategories,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: value,
      inStock: inStockOnly,
      isFeatured: isFeatured,
      page: pagination.page,
    });
  };

  const handleStockChange = (checked) => {
    setInStockOnly(checked);
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({
      categories: selectedCategories,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      inStock: checked,
      isFeatured: isFeatured,
      page: 1,
    });
  };

  const handleFeaturedChange = (checked) => {
    setIsFeatured(checked);
    setPagination((prev) => ({ ...prev, page: 1 }));
    updateURL({
      categories: selectedCategories,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      inStock: inStockOnly,
      isFeatured: checked,
      page: 1,
    });
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: "", max: "" });
    setSortBy("-createdAt");
    setInStockOnly(false);
    setIsFeatured(false);
    setPagination((prev) => ({ ...prev, page: 1 }));

    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateURL({
      categories: selectedCategories,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      inStock: inStockOnly,
      isFeatured: isFeatured,
      page: newPage,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange.min ||
    priceRange.max ||
    sortBy !== "-createdAt" ||
    inStockOnly ||
    isFeatured;

  const sortOptions = [
    { value: "-createdAt", label: "Newest First" },
    { value: "createdAt", label: "Oldest First" },
    { value: "-price", label: "Price: High to Low" },
    { value: "price", label: "Price: Low to High" },
    { value: "-ratings.average", label: "Highest Rated" },
    { value: "-views", label: "Most Popular" },
  ];

  // Breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [{ name: "Home", url: "/", icon: Home }];

    if (searchQuery) {
      items.push({ name: "Search", url: "/shop", icon: Search });
      items.push({ name: `"${searchQuery}"`, url: null });
    } else if (selectedCategories.length === 1) {
      const cat = categories.find((c) => c._id === selectedCategories[0]);
      if (cat) {
        items.push({
          name: "Categories",
          url: "/categories",
          icon: LayoutGrid,
        });
        items.push({
          name: cat.name?.bn || cat.name?.en,
          url: null,
        });
      } else {
        items.push({ name: "All Products", url: null });
      }
    } else if (selectedCategories.length > 1) {
      items.push({ name: "Categories", url: "/categories", icon: LayoutGrid });
      items.push({ name: `${selectedCategories.length} Selected`, url: null });
    } else {
      items.push({ name: "All Products", url: null });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      {/* Breadcrumb Section */}
      <div className="bg-white border-b border-neutral-100 overflow-x-auto no-scrollbar">
        {/* py-4 কমিয়ে py-3 করা হয়েছে যাতে ৩২০px এ ভার্টিকাল স্পেস বাঁচে */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 min-w-max sm:min-w-0 mt-2">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-sm whitespace-nowrap">
            {breadcrumbItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0"
              >
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-300 shrink-0" />
                )}

                {item.url ? (
                  <Link
                    to={item.url}
                    className="flex items-center gap-1 sm:gap-1.5 text-neutral-500 hover:text-primary-600 transition-colors font-medium hover:underline underline-offset-4 decoration-primary-200"
                  >
                    {item.icon && (
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    )}
                    <span className={item.icon ? "font-bangla" : ""}>
                      {item.name}
                    </span>
                  </Link>
                ) : (
                  <span className="text-primary-600 font-bold font-bangla flex items-center gap-1 sm:gap-1.5">
                    {item.icon && (
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    )}
                    {item.name}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-6 sm:py-10 relative overflow-hidden">
        {/* Decorative Elements - ছোট স্ক্রিনে সাইজ কমানো হয়েছে */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-40 h-40 sm:w-64 sm:h-64 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full blur-xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* Title Section */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 font-bangla animate-fade-in tracking-tight leading-tight">
                {searchQuery ? (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5 sm:w-8 sm:h-8 shrink-0 text-primary-200" />
                    <span className="truncate">"{searchQuery}" এর ফলাফল</span>
                  </span>
                ) : selectedCategories.length === 1 ? (
                  selectedCategoryNames[0] || "Products"
                ) : selectedCategories.length > 1 ? (
                  "Selected Categories"
                ) : (
                  "সব পণ্য"
                )}
              </h1>
              <p className="text-primary-100 text-[13px] sm:text-lg font-bangla opacity-90">
                {pagination.total}টি পণ্য পাওয়া গেছে
              </p>
            </div>

            {/* Quick Stats - ৩২০px এর জন্য Flex-row থেকে Grid বা টাইট ফ্লেক্স করা হয়েছে */}
            <div className="flex gap-3 sm:gap-4 items-center">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2 sm:px-6 sm:py-3 border border-white/20 shadow-lg shadow-black/5 flex-1 sm:flex-none text-center">
                <span className="block text-2xl sm:text-3xl font-black leading-none">
                  {pagination.total}
                </span>
                <span className="text-[10px] sm:text-xs text-primary-200 font-bangla uppercase tracking-widest mt-1 block">
                  মোট পণ্য
                </span>
              </div>

              {selectedCategories.length > 0 && (
                <div className="bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2 sm:px-6 sm:py-3 border border-white/20 shadow-lg shadow-black/5 flex-1 sm:flex-none text-center">
                  <span className="block text-2xl sm:text-3xl font-black leading-none">
                    {selectedCategories.length}
                  </span>
                  <span className="text-[10px] sm:text-xs text-primary-200 font-bangla uppercase tracking-widest mt-1 block">
                    ক্যাটাগরি
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              {/* Categories Filter */}
              <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                  <h3 className="font-semibold text-neutral-800 flex items-center gap-2 font-bangla">
                    <LayoutGrid className="w-5 h-5 text-primary-500" />
                    ক্যাটাগরি
                  </h3>
                </div>
                <div className="p-4">
                  <CategorySidebar
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
              </div>

              {/* Price Range Filter */}
              <div
                className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                  <h3 className="font-semibold text-neutral-800 font-bangla">
                    মূল্য পরিসীমা
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-neutral-500 mb-1.5 block font-bangla">
                        সর্বনিম্ন
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                          ৳
                        </span>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) =>
                            handlePriceChange("min", e.target.value)
                          }
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-neutral-500 mb-1.5 block font-bangla">
                        সর্বোচ্চ
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                          ৳
                        </span>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) =>
                            handlePriceChange("max", e.target.value)
                          }
                          placeholder="৯৯৯৯৯"
                          className="w-full pl-7 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={applyPriceFilter}
                    className="w-full py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-300 font-medium font-bangla shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-[0.98]"
                  >
                    মূল্য প্রয়োগ করুন
                  </button>
                </div>
              </div>

              {/* Availability Filter */}
              <div
                className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                  <h3 className="font-semibold text-neutral-800 font-bangla">
                    প্রাপ্যতা
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => handleStockChange(e.target.checked)}
                      className="w-5 h-5 text-primary-500 border-neutral-300 rounded-lg focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-bangla">
                      শুধুমাত্র স্টকে আছে
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => handleFeaturedChange(e.target.checked)}
                      className="w-5 h-5 text-primary-500 border-neutral-300 rounded-lg focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-bangla">
                      ফিচার্ড পণ্য
                    </span>
                  </label>
                </div>
              </div>

              {/* Clear All Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-all duration-300 font-medium flex items-center justify-center gap-2 animate-fade-in font-bangla hover:border-red-300"
                >
                  <X className="w-4 h-4" />
                  সব ফিল্টার মুছুন
                </button>
              )}
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-700 py-3.5 rounded-xl shadow-soft font-medium font-bangla active:scale-[0.98] transition-transform"
            >
              <SlidersHorizontal className="w-5 h-5 text-primary-500" />
              ফিল্টার
              {hasActiveFilters && (
                <span className="bg-primary-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  {selectedCategories.length +
                    (priceRange.min || priceRange.max ? 1 : 0) +
                    (inStockOnly ? 1 : 0) +
                    (isFeatured ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filter Drawer */}
          {showMobileFilters && (
            <>
              <div
                className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 overflow-y-auto lg:hidden shadow-2xl">
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                  <h2 className="font-bold text-lg text-neutral-800 font-bangla">
                    ফিল্টার
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-neutral-800 font-bangla">
                      ক্যাটাগরি
                    </h3>
                    <CategorySidebar
                      selectedCategories={selectedCategories}
                      onCategoryChange={handleCategoryChange}
                    />
                  </div>

                  <div className="border-t border-neutral-100 pt-6">
                    <h3 className="font-semibold mb-3 text-neutral-800 font-bangla">
                      মূল্য পরিসীমা
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) =>
                          handlePriceChange("min", e.target.value)
                        }
                        placeholder="সর্বনিম্ন"
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) =>
                          handlePriceChange("max", e.target.value)
                        }
                        placeholder="সর্বোচ্চ"
                        className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      onClick={applyPriceFilter}
                      className="w-full py-2 bg-primary-500 text-white rounded-lg font-bangla"
                    >
                      প্রয়োগ করুন
                    </button>
                  </div>

                  <div className="border-t border-neutral-100 pt-6 space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => handleStockChange(e.target.checked)}
                        className="w-4 h-4 text-primary-500 rounded"
                      />
                      <span className="font-bangla text-neutral-700">
                        শুধুমাত্র স্টকে আছে
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => handleFeaturedChange(e.target.checked)}
                        className="w-4 h-4 text-primary-500 rounded"
                      />
                      <span className="font-bangla text-neutral-700">
                        ফিচার্ড পণ্য
                      </span>
                    </label>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-medium font-bangla border border-red-200"
                    >
                      সব ফিল্টার মুছুন
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Results Count */}
                <div className="text-sm text-neutral-600 font-bangla">
                  দেখাচ্ছে {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  এর মধ্যে {pagination.total}টি পণ্য
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-neutral-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === "grid"
                          ? "bg-white text-primary-600 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === "list"
                          ? "bg-white text-primary-600 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-700 py-2.5 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-sm font-medium font-bangla min-w-[160px]"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label === "Newest First" &&
                            "নতুন থেকে পুরাতন"}
                          {option.label === "Oldest First" &&
                            "পুরাতন থেকে নতুন"}
                          {option.label === "Price: High to Low" &&
                            "দাম: বেশি থেকে কম"}
                          {option.label === "Price: Low to High" &&
                            "দাম: কম থেকে বেশি"}
                          {option.label === "Highest Rated" && "রেটিং অনুযায়ী"}
                          {option.label === "Most Popular" &&
                            "জনপ্রিয়তা অনুযায়ী"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-neutral-100 animate-fade-in">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-neutral-500 font-bangla">
                      সক্রিয় ফিল্টার:
                    </span>
                    {selectedCategories.map((catId, idx) => (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-lg border border-primary-100 font-bangla"
                      >
                        {selectedCategoryNames[idx] || "Category"}
                        <button
                          onClick={() =>
                            handleCategoryChange(
                              selectedCategories.filter((c) => c !== catId),
                            )
                          }
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {priceRange.min && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-50 text-secondary-600 text-sm rounded-lg border border-secondary-100 font-bangla">
                        ন্যূনতম: ৳{priceRange.min}
                        <button
                          onClick={() => {
                            setPriceRange((prev) => ({ ...prev, min: "" }));
                            applyPriceFilter();
                          }}
                          className="hover:bg-secondary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                    {priceRange.max && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-50 text-secondary-600 text-sm rounded-lg border border-secondary-100 font-bangla">
                        সর্বোচ্চ: ৳{priceRange.max}
                        <button
                          onClick={() => {
                            setPriceRange((prev) => ({ ...prev, max: "" }));
                            applyPriceFilter();
                          }}
                          className="hover:bg-secondary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                    {inStockOnly && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 font-bangla">
                        স্টকে আছে
                        <button
                          onClick={() => handleStockChange(false)}
                          className="hover:bg-green-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                    {isFeatured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 text-sm rounded-lg border border-amber-100 font-bangla">
                        ফিচার্ড
                        <button
                          onClick={() => handleFeaturedChange(false)}
                          className="hover:bg-amber-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100 shadow-soft">
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-12 h-12 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2 font-bangla">
                  কোনো পণ্য পাওয়া যায়নি
                </h3>
                <p className="text-neutral-500 mb-6 font-bangla">
                  আপনার ফিল্টার পরিবর্তন করুন বা অন্য কিছু সার্চ করুন
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-8 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-300 font-bangla shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                  >
                    সব ফিল্টার মুছুন
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${
                    viewMode === "grid"
                      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-soft border border-neutral-100">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors font-bangla text-neutral-700"
                      >
                        আগে
                      </button>

                      {[...Array(pagination.pages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.pages ||
                          (pageNum >= pagination.page - 1 &&
                            pageNum <= pagination.page + 1)
                        ) {
                          return (
                            <button
                              key={i}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-11 h-11 rounded-xl text-sm font-bold transition-all duration-200 ${
                                pagination.page === pageNum
                                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                                  : "text-neutral-700 hover:bg-neutral-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === pagination.page - 2 ||
                          pageNum === pagination.page + 2
                        ) {
                          return (
                            <span key={i} className="text-neutral-400 px-1">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors font-bangla text-neutral-700"
                      >
                        পরে
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
