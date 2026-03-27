import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  RefreshCw,
  Star,
  Download,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Home,
  ChevronRight as ChevronRightIcon,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";
import AdminSidebar from "./AdminSidebar";

const ManageProducts = () => {
  // State Management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [limit] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("-createdAt");
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
    permanent: false,
  });

  // Bulk Actions
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    category: "",
    subCategory: "",
    stock: "",
    sku: "",
    tags: "",
    isActive: true,
    isFeatured: false,
    metaTitle: "",
    metaDescription: "",
    specifications: {
      weight: "",
      weightUnit: "kg",
      material: "",
      color: "",
      warranty: "",
      dimensions: { length: "", width: "", height: "" },
    },
  });

  // Create Product Modal States
  const [createImages, setCreateImages] = useState([]);
  const [createImagePreview, setCreateImagePreview] = useState([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createUploadProgress, setCreateUploadProgress] = useState(0);
  const [createPriceError, setCreatePriceError] = useState("");

  // Search Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    featured: 0,
  });

  // 🔴 [NEW] Sidebar and Breadcrumb state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // 🔴 [NEW] Breadcrumb configuration
  const BREADCRUMB_MAP = {
    admin: { label: "Admin", labelBn: "অ্যাডমিন", icon: Home },
    products: { label: "Products", labelBn: "প্রোডাক্টস", icon: Package },
  };

  // 🔴 [NEW] Breadcrumb Component
  const ProductBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);

    return (
      <nav className="flex items-center gap-2 text-sm mb-6 px-1">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-1 text-neutral-500 hover:text-violet-600 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="font-bangla hidden sm:inline">ড্যাশবোর্ড</span>
        </Link>

        {paths.slice(1).map((segment, index) => {
          const config = BREADCRUMB_MAP[segment];
          if (!config) return null;

          const path = "/" + paths.slice(0, index + 2).join("/");
          const isLast = index === paths.length - 2;

          return (
            <div key={path} className="flex items-center gap-2">
              <ChevronRightIcon className="w-4 h-4 text-neutral-400" />
              {isLast ? (
                <span className="flex items-center gap-1.5 text-violet-700 font-semibold bg-violet-50 px-3 py-1.5 rounded-lg">
                  <config.icon className="w-4 h-4" />
                  <span className="font-bangla">{config.labelBn}</span>
                  <span className="hidden sm:inline text-violet-600/70 text-xs">
                    / {config.label}
                  </span>
                </span>
              ) : (
                <Link
                  to={path}
                  className="flex items-center gap-1.5 text-neutral-600 hover:text-violet-600 transition-colors"
                >
                  <config.icon className="w-4 h-4" />
                  <span className="font-bangla">{config.labelBn}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/categories");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // Fetch Products with all filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", limit);
      params.append("sort", sortBy);

      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (stockFilter === "in") params.append("inStock", "true");
      if (stockFilter === "out") params.append("inStock", "false");
      if (featuredFilter === "true") params.append("isFeatured", "true");
      if (priceRange.min) params.append("minPrice", priceRange.min);
      if (priceRange.max) params.append("maxPrice", priceRange.max);

      const response = await axiosInstance.get(`/products?${params}`);

      if (response.data.success) {
        setProducts(response.data.products || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
          setTotalProducts(response.data.pagination.total || 0);
        }

        setStats({
          total: response.data.pagination?.total || 0,
          active: response.data.products?.filter((p) => p.isActive).length || 0,
          outOfStock:
            response.data.products?.filter((p) => p.stock === 0).length || 0,
          featured:
            response.data.products?.filter((p) => p.isFeatured).length || 0,
        });
      }
    } catch (err) {
      setError("প্রোডাক্ট লোড করতে সমস্যা হয়েছে");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    limit,
    searchQuery,
    selectedCategory,
    stockFilter,
    featuredFilter,
    priceRange,
    sortBy,
  ]);

  // Initial Load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Products (Autocomplete)
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/products/search-suggestions?q=${query}&limit=5`,
      );
      setSuggestions(response.data.products || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Show notification
  const showNotification = (message, type = "success") => {
    if (type === "success") {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // ========== CREATE PRODUCT FUNCTIONS ==========

  const resetCreateForm = () => {
    setCreateFormData({
      name: "",
      description: "",
      price: "",
      discountPrice: "",
      category: "",
      subCategory: "",
      stock: "",
      sku: "",
      tags: "",
      isActive: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      specifications: {
        weight: "",
        weightUnit: "kg",
        material: "",
        color: "",
        warranty: "",
        dimensions: { length: "", width: "", height: "" },
      },
    });
    setCreateImages([]);
    setCreateImagePreview([]);
    setCreateUploadProgress(0);
    setCreatePriceError("");
  };

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    createImagePreview.forEach((url) => URL.revokeObjectURL(url));
    setIsCreateModalOpen(false);
  };

  const validateCreatePrices = () => {
    const price = parseFloat(createFormData.price);
    const discountPrice = parseFloat(createFormData.discountPrice);

    if (isNaN(price) || price <= 0) {
      setCreatePriceError("সঠিক মূল্য দিন");
      return false;
    }

    if (createFormData.discountPrice && !isNaN(discountPrice)) {
      if (discountPrice >= price) {
        setCreatePriceError("ডিসকাউন্ট মূল্য অবশ্যই মূল্যের চেয়ে কম হতে হবে");
        return false;
      }
      if (discountPrice < 0) {
        setCreatePriceError("ডিসকাউন্ট মূল্য নেগেটিভ হতে পারে না");
        return false;
      }
    }

    setCreatePriceError("");
    return true;
  };

  const handleCreatePriceChange = (field, value) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    setCreateFormData((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
    setTimeout(() => validateCreatePrices(), 0);
  };

  const getCreateSubCategories = () => {
    const selectedCat = categories.find(
      (cat) => cat._id === createFormData.category,
    );
    return selectedCat?.subCategories || [];
  };

  const handleCreateImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + createImagePreview.length > 5) {
      showNotification("সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন", "error");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showNotification(`${file.name} একটি ছবি নয়`, "error");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification(`${file.name} ৫MB এর বেশি`, "error");
        return false;
      }
      return true;
    });

    setCreateImages((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setCreateImagePreview((prev) => [...prev, ...previews]);
  };

  const removeCreateImage = (index) => {
    setCreateImagePreview((prev) => prev.filter((_, i) => i !== index));
    setCreateImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!validateCreatePrices()) return;

    setCreateSubmitting(true);
    setCreateUploadProgress(0);

    try {
      const data = new FormData();

      // Basic fields
      data.append("name", createFormData.name.trim());
      data.append("description", createFormData.description.trim());
      data.append("price", createFormData.price);
      data.append("stock", createFormData.stock);

      if (
        createFormData.discountPrice &&
        parseFloat(createFormData.discountPrice) > 0
      ) {
        data.append("discountPrice", createFormData.discountPrice);
      }

      data.append("category", createFormData.category);
      data.append("isActive", createFormData.isActive);
      data.append("isFeatured", createFormData.isFeatured);

      if (createFormData.subCategory)
        data.append("subCategory", createFormData.subCategory);
      if (createFormData.sku) data.append("sku", createFormData.sku.trim());
      if (createFormData.metaTitle)
        data.append("metaTitle", createFormData.metaTitle.trim());
      if (createFormData.metaDescription)
        data.append("metaDescription", createFormData.metaDescription.trim());

      // Tags
      if (createFormData.tags) {
        const tagsArray = createFormData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
        tagsArray.forEach((tag) => data.append("tags", tag));
      }

      // Specifications
      if (createFormData.specifications.weight) {
        data.append(
          "specifications[weight]",
          createFormData.specifications.weight,
        );
        data.append(
          "specifications[weightUnit]",
          createFormData.specifications.weightUnit,
        );
      }
      if (createFormData.specifications.material) {
        data.append(
          "specifications[material]",
          createFormData.specifications.material.trim(),
        );
      }
      if (createFormData.specifications.color) {
        data.append(
          "specifications[color]",
          createFormData.specifications.color.trim(),
        );
      }
      if (createFormData.specifications.warranty) {
        data.append(
          "specifications[warranty]",
          createFormData.specifications.warranty.trim(),
        );
      }
      if (createFormData.specifications.dimensions.length) {
        data.append(
          "specifications[dimensions][length]",
          createFormData.specifications.dimensions.length,
        );
      }
      if (createFormData.specifications.dimensions.width) {
        data.append(
          "specifications[dimensions][width]",
          createFormData.specifications.dimensions.width,
        );
      }
      if (createFormData.specifications.dimensions.height) {
        data.append(
          "specifications[dimensions][height]",
          createFormData.specifications.dimensions.height,
        );
      }

      // Images
      createImages.forEach((image) => {
        data.append("images", image);
      });

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setCreateUploadProgress(percentCompleted);
        },
      };

      await axiosInstance.post("/products", data, config);

      showNotification("প্রোডাক্ট সফলভাবে তৈরি হয়েছে");
      closeCreateModal();
      fetchProducts();
    } catch (err) {
      console.error("Create error:", err.response?.data);
      showNotification(
        err.response?.data?.message || "প্রোডাক্ট তৈরি ব্যর্থ হয়েছে",
        "error",
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ========== UPDATE & OTHER FUNCTIONS ==========

  // Open Update Modal
  const openUpdateModal = (product) => {
    setEditingProduct(product);
    setIsUpdateModalOpen(true);
  };

  // Close Update Modal
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setEditingProduct(null);
  };

  // Handle Update Success
  const handleUpdateSuccess = (message) => {
    showNotification(message);
    fetchProducts();
  };

  // View Product Details
  const viewProduct = async (slug) => {
    try {
      const response = await axiosInstance.get(`/products/${slug}`);
      setViewingProduct(response.data.product);
    } catch (err) {
      showNotification("প্রোডাক্টের বিস্তারিত লোড করতে সমস্যা হয়েছে", "error");
    }
  };

  // Delete Product
  const handleDelete = async () => {
    if (!deleteModal.product) return;

    try {
      await axiosInstance.delete(
        `/products/${deleteModal.product._id}?permanent=${deleteModal.permanent}`,
      );
      showNotification(
        deleteModal.permanent
          ? "প্রোডাক্ট স্থায়ীভাবে মুছে ফেলা হয়েছে"
          : "প্রোডাক্ট ডিঅ্যাক্টিভেট করা হয়েছে",
      );
      setDeleteModal({ open: false, product: null, permanent: false });
      fetchProducts();
    } catch (err) {
      showNotification("মুছে ফেলতে সমস্যা হয়েছে", "error");
    }
  };

  // Update Stock Only
  const handleStockUpdate = async (productId, newStock) => {
    try {
      await axiosInstance.patch(`/products/${productId}/stock`, {
        stock: Number(newStock),
      });
      showNotification("স্টক আপডেট হয়েছে");
      fetchProducts();
    } catch (err) {
      showNotification("স্টক আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  // Toggle Featured Status
  const toggleFeatured = async (product) => {
    try {
      await axiosInstance.patch(`/products/${product._id}`, {
        isFeatured: !product.isFeatured,
      });
      showNotification(
        product.isFeatured ? "ফিচার্ড থেকে সরানো হয়েছে" : "ফিচার্ড করা হয়েছে",
      );
      fetchProducts();
    } catch (err) {
      showNotification("আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  // Toggle Active Status
  const toggleActive = async (product) => {
    try {
      await axiosInstance.patch(`/products/${product._id}`, {
        isActive: !product.isActive,
      });
      showNotification(
        product.isActive
          ? "ডিঅ্যাক্টিভেট করা হয়েছে"
          : "অ্যাক্টিভেট করা হয়েছে",
      );
      fetchProducts();
    } catch (err) {
      showNotification("আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async (permanent = false) => {
    if (selectedProducts.length === 0) return;

    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedProducts.map((id) =>
          axiosInstance.delete(`/products/${id}?permanent=${permanent}`),
        ),
      );
      showNotification(
        `${selectedProducts.length}টি প্রোডাক্ট মুছে ফেলা হয়েছে`,
      );
      setSelectedProducts([]);
      fetchProducts();
    } catch (err) {
      showNotification("বাল্ক অপারেশন ব্যর্থ হয়েছে", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Name",
      "SKU",
      "Price",
      "Stock",
      "Category",
      "Status",
      "Featured",
    ];
    const csvContent = [
      headers.join(","),
      ...products.map((p) =>
        [
          `"${p.name}"`,
          p.sku || "",
          p.price,
          p.stock,
          p.category?.name?.en || "",
          p.isActive ? "Active" : "Inactive",
          p.isFeatured ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Format helpers
  const formatPrice = (price) => new Intl.NumberFormat("bn-BD").format(price);
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const getDiscountPercentage = (price, discountPrice) => {
    if (!discountPrice || discountPrice >= price) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p._id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 🔴 [NEW] Admin Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* 🔴 [NEW] Main Content with responsive margin */}
      <div
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-0" : "ml-0"}`}
      >
        <div className="p-4 lg:p-6">
          <div className="lg:hidden flex items-center justify-between mb-4 bg-white p-3 rounded-xl shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bangla font-medium text-gray-700">
              প্রোডাক্ট ম্যানেজমেন্ট
            </span>
            <div className="w-8" />
          </div>
          {/* 🔴 [NEW] Breadcrumb */}
          <ProductBreadcrumbs />

          {/* Notifications */}
          {successMessage && (
            <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              {successMessage}
            </div>
          )}
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Package className="w-8 h-8 text-violet-600" />
                <span className="font-bangla">প্রোডাক্ট ম্যানেজমেন্ট</span>
              </h1>
              <p className="text-gray-600 text-sm lg:text-base">
                সমস্ত প্রোডাক্ট দেখুন, সম্পাদনা করুন এবং পরিচালনা করুন
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">এক্সপোর্ট CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-violet-600 text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors text-sm"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">নতুন প্রোডাক্ট</span>
                <span className="sm:hidden">নতুন</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-violet-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bangla">
                    মোট প্রোডাক্ট
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <Package className="w-6 h-6 lg:w-8 lg:h-8 text-violet-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bangla">সক্রিয়</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bangla">স্টক শেষ</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    {stats.outOfStock}
                  </p>
                </div>
                <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bangla">ফিচার্ড</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    {stats.featured}
                  </p>
                </div>
                <Star className="w-6 h-6 lg:w-8 lg:h-8 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
              {/* Search */}
              <div
                className="relative flex-1 min-w-[200px] lg:min-w-[300px]"
                ref={searchRef}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                />
                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSearchQuery(suggestion.name);
                          setShowSuggestions(false);
                          viewProduct(suggestion.slug);
                        }}
                      >
                        {suggestion.images?.[0]?.url && (
                          <img
                            src={suggestion.images[0].url}
                            alt=""
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {suggestion.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ৳{suggestion.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 lg:gap-3 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="-createdAt">নতুনতম</option>
                  <option value="createdAt">পুরাতনতম</option>
                  <option value="-price">দাম (বেশি থেকে কম)</option>
                  <option value="price">দাম (কম থেকে বেশি)</option>
                  <option value="-stock">স্টক (বেশি থেকে কম)</option>
                  <option value="name">নাম (A-Z)</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm ${
                    showFilters
                      ? "bg-violet-50 border-violet-500 text-violet-600"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">ফিল্টার</span>
                  {showFilters ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="">সব ক্যাটাগরি</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name?.bn || cat.name?.en || "Unnamed"}
                    </option>
                  ))}
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="">সব স্টক</option>
                  <option value="in">স্টকে আছে</option>
                  <option value="out">স্টক শেষ</option>
                </select>

                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="">সব</option>
                  <option value="true">ফিচার্ড</option>
                </select>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ন্যূনতম দাম"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, min: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="সর্বোচ্চ দাম"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, max: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-violet-800 font-medium text-sm">
                <span className="font-bangla">
                  {selectedProducts.length}টি প্রোডাক্ট নির্বাচিত
                </span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkDelete(false)}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm"
                >
                  ডিঅ্যাক্টিভেট
                </button>
                <button
                  onClick={() => handleBulkDelete(true)}
                  disabled={bulkActionLoading}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  স্থায়ীভাবে মুছুন
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Package className="w-16 h-16 mb-4 text-gray-300" />
                <p className="font-bangla">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedProducts.length === products.length &&
                              products.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ছবি
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          নাম
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          ক্যাটাগরি
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          দাম
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          স্টক
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          স্ট্যাটাস
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          অ্যাকশন
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr
                          key={product._id}
                          className={`hover:bg-gray-50 ${!product.isActive ? "bg-gray-100" : ""}`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() =>
                                toggleProductSelection(product._id)
                              }
                              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="relative">
                              <img
                                src={
                                  product.images?.[0]?.url || "/placeholder.png"
                                }
                                alt={product.name}
                                className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-cover"
                              />
                              {product.isFeatured && (
                                <Star className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {product.name}
                            </div>
                            {product.sku && (
                              <div className="text-xs text-gray-500">
                                SKU: {product.sku}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(product.createdAt)}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap hidden md:table-cell">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-violet-100 text-violet-800">
                              {product.category?.name?.bn ||
                                product.category?.name?.en ||
                                "N/A"}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-1">
                              <span className="font-semibold">
                                ৳{formatPrice(product.price)}
                              </span>
                              {product.discountPrice > 0 && (
                                <span className="text-xs text-emerald-600 font-medium">
                                  -
                                  {getDiscountPercentage(
                                    product.price,
                                    product.discountPrice,
                                  )}
                                  %
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={product.stock}
                              onChange={(e) =>
                                handleStockUpdate(product._id, e.target.value)
                              }
                              className={`w-16 lg:w-20 px-2 py-1 border rounded text-center text-sm ${
                                product.stock === 0
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-200"
                              }`}
                              min="0"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleActive(product)}
                              className={`flex items-center gap-1 text-xs font-medium ${
                                product.isActive
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {product.isActive ? (
                                <>
                                  <ToggleRight className="w-4 h-4" />{" "}
                                  <span className="hidden sm:inline font-bangla">
                                    সক্রিয়
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4" />{" "}
                                  <span className="hidden sm:inline font-bangla">
                                    নিষ্ক্রিয়
                                  </span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleFeatured(product)}
                                className={`p-1.5 rounded-lg ${product.isFeatured ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-gray-50"}`}
                              >
                                <Star
                                  className={`w-4 h-4 ${product.isFeatured ? "fill-current" : ""}`}
                                />
                              </button>
                              <button
                                onClick={() => viewProduct(product.slug)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openUpdateModal(product)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    open: true,
                                    product,
                                    permanent: false,
                                  })
                                }
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    <span className="font-bangla">মোট</span>{" "}
                    <span className="font-medium">{totalProducts}</span>{" "}
                    <span className="font-bangla">টি প্রোডাক্ট</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2 text-sm">
                      <span className="font-bangla">পেজ</span>{" "}
                      <span className="font-medium">{currentPage}</span> /{" "}
                      {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========== CREATE PRODUCT MODAL ========== */}
      {/* [UNCHANGED - Same as original] */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={closeCreateModal}
            />

            <div className="inline-block w-full max-w-5xl my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  নতুন প্রোডাক্ট তৈরি
                </h2>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Error Notification */}
              {createPriceError && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{createPriceError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">
                      মূল তথ্য
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        প্রোডাক্টের নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.name}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="প্রোডাক্টের নাম লিখুন"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ক্যাটাগরি *
                      </label>
                      <select
                        required
                        value={createFormData.category}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            category: e.target.value,
                            subCategory: "",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name?.bn || cat.name?.en} ({cat.name?.en})
                          </option>
                        ))}
                      </select>
                    </div>

                    {getCreateSubCategories().length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          সাব-ক্যাটাগরি
                        </label>
                        <select
                          value={createFormData.subCategory}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              subCategory: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">সাব-ক্যাটাগরি নির্বাচন করুন</option>
                          {getCreateSubCategories().map((sub) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name?.bn || sub.name?.en}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Price Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          মূল্য (Regular Price) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ৳
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            required
                            value={createFormData.price}
                            onChange={(e) =>
                              handleCreatePriceChange("price", e.target.value)
                            }
                            className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${createPriceError ? "border-red-500" : "border-gray-300"}`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ডিসকাউন্ট মূল্য (Sale Price)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ৳
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={createFormData.discountPrice}
                            onChange={(e) =>
                              handleCreatePriceChange(
                                "discountPrice",
                                e.target.value,
                              )
                            }
                            className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${createPriceError ? "border-red-500" : "border-gray-300"}`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price Preview */}
                    {createFormData.price && !createPriceError && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">মূল্য:</span>
                          <span className="font-semibold">
                            ৳
                            {parseFloat(createFormData.price).toLocaleString(
                              "bn-BD",
                            )}
                          </span>
                        </div>
                        {createFormData.discountPrice &&
                          parseFloat(createFormData.discountPrice) > 0 && (
                            <>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-gray-600">
                                  ডিসকাউন্ট:
                                </span>
                                <span className="font-semibold text-green-600">
                                  ৳
                                  {parseFloat(
                                    createFormData.discountPrice,
                                  ).toLocaleString("bn-BD")}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1 pt-1 border-t border-blue-200">
                                <span className="text-sm font-medium">
                                  সেভ করবেন:
                                </span>
                                <span className="font-bold text-blue-600">
                                  ৳
                                  {(
                                    parseFloat(createFormData.price) -
                                    parseFloat(createFormData.discountPrice)
                                  ).toLocaleString("bn-BD")}
                                </span>
                              </div>
                            </>
                          )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          স্টক *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={createFormData.stock}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              stock: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={createFormData.sku}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              sku: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="প্রোডাক্ট কোড"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">
                      অতিরিক্ত তথ্য
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        বিবরণ *
                      </label>
                      <textarea
                        rows="4"
                        required
                        value={createFormData.description}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="প্রোডাক্টের বিস্তারিত বিবরণ"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ওজন
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={createFormData.specifications.weight}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                specifications: {
                                  ...createFormData.specifications,
                                  weight: e.target.value,
                                },
                              })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={createFormData.specifications.weightUnit}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                specifications: {
                                  ...createFormData.specifications,
                                  weightUnit: e.target.value,
                                },
                              })
                            }
                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="kg">কেজি</option>
                            <option value="gm">গ্রাম</option>
                            <option value="lb">পাউন্ড</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ম্যাটেরিয়াল
                        </label>
                        <input
                          type="text"
                          value={createFormData.specifications.material}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              specifications: {
                                ...createFormData.specifications,
                                material: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          রং
                        </label>
                        <input
                          type="text"
                          value={createFormData.specifications.color}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              specifications: {
                                ...createFormData.specifications,
                                color: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ওয়ারেন্টি
                        </label>
                        <input
                          type="text"
                          value={createFormData.specifications.warranty}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              specifications: {
                                ...createFormData.specifications,
                                warranty: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="যেমন: ১ বছর"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ডাইমেনশন (L×W×H)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          placeholder="দৈর্ঘ্য"
                          value={
                            createFormData.specifications.dimensions.length
                          }
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              specifications: {
                                ...createFormData.specifications,
                                dimensions: {
                                  ...createFormData.specifications.dimensions,
                                  length: e.target.value,
                                },
                              },
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="প্রস্থ"
                          value={createFormData.specifications.dimensions.width}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              specifications: {
                                ...createFormData.specifications,
                                dimensions: {
                                  ...createFormData.specifications.dimensions,
                                  width: e.target.value,
                                },
                              },
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="উচ্চতা"
                          value={
                            createFormData.specifications.dimensions.height
                          }
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              specifications: {
                                ...createFormData.specifications,
                                dimensions: {
                                  ...createFormData.specifications.dimensions,
                                  height: e.target.value,
                                },
                              },
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ট্যাগ (কমা দিয়ে আলাদা করুন)
                      </label>
                      <input
                        type="text"
                        value={createFormData.tags}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            tags: e.target.value,
                          })
                        }
                        placeholder="চা, গ্রিন টি, অর্গানিক"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createFormData.isActive}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              isActive: e.target.checked,
                            })
                          }
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          সক্রিয়
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createFormData.isFeatured}
                          onChange={(e) =>
                            setCreateFormData({
                              ...createFormData,
                              isFeatured: e.target.checked,
                            })
                          }
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          ফিচার্ড
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Images Section */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    প্রোডাক্ট ছবি (সর্বোচ্চ ৫টি) - {createImagePreview.length}/5
                  </label>

                  <div className="flex items-center justify-center w-full">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${createImagePreview.length >= 5 ? "border-gray-200 opacity-50 cursor-not-allowed" : "border-gray-300"}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          ছবি আপলোড করতে ক্লিক করুন
                        </p>
                        <p className="text-xs text-gray-400">
                          (সর্বোচ্চ ৫টি, প্রতিটি ৫MB এর কম)
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleCreateImageChange}
                        disabled={createImagePreview.length >= 5}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {createImagePreview.length > 0 && (
                    <div className="flex gap-4 mt-4 flex-wrap">
                      {createImagePreview.map((src, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={src}
                            alt={`Preview ${idx}`}
                            className="h-20 w-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeCreateImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SEO Fields */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      মেটা টাইটেল
                    </label>
                    <input
                      type="text"
                      value={createFormData.metaTitle}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          metaTitle: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={70}
                      placeholder="SEO টাইটেল (সর্বোচ্চ ৭০ অক্ষর)"
                    />
                    <span className="text-xs text-gray-500">
                      {createFormData.metaTitle.length}/70
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      মেটা ডেসক্রিপশন
                    </label>
                    <textarea
                      value={createFormData.metaDescription}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          metaDescription: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      maxLength={160}
                      placeholder="SEO ডেসক্রিপশন (সর্বোচ্চ ১৬০ অক্ষর)"
                    />
                    <span className="text-xs text-gray-500">
                      {createFormData.metaDescription.length}/160
                    </span>
                  </div>
                </div>

                {/* Upload Progress */}
                {createUploadProgress > 0 && createUploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${createUploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 text-center">
                      {createUploadProgress}% আপলোড হয়েছে
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting || createPriceError}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {createSubmitting && (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                    তৈরি করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Modal */}
      <UpdateProduct
        product={editingProduct}
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        onSuccess={handleUpdateSuccess}
        categories={categories}
      />

      {/* View Product Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setViewingProduct(null)}
            />
            <div className="inline-block w-full max-w-4xl my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-start p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {viewingProduct.name}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Slug: {viewingProduct.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewingProduct(null);
                      openUpdateModal(viewingProduct);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" /> এডিট
                  </button>
                  <button
                    onClick={() => setViewingProduct(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p>প্রোডাক্টের বিস্তারিত তথ্য এখানে দেখানো হবে...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              নিশ্চিত করুন
            </h3>
            <p className="text-gray-600 mb-4">
              আপনি কি নিশ্চিতভাবে <strong>{deleteModal.product?.name}</strong>{" "}
              মুছে ফেলতে চান?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    product: null,
                    permanent: false,
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                বাতিল
              </button>
              {!deleteModal.permanent && (
                <button
                  onClick={() =>
                    setDeleteModal({ ...deleteModal, permanent: true })
                  }
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  স্থায়ীভাবে মুছুন
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {deleteModal.permanent
                  ? "স্থায়ীভাবে মুছুন"
                  : "ডিঅ্যাক্টিভেট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
