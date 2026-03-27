import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Save,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
  Home,
  Search,
  Filter,
  LayoutDashboard,
  Store,
  ShoppingBag,
  Package,
  GraduationCap,
  Layers,
  DollarSign,
  CreditCard,
  Percent,
  FileText,
  BarChart3,
  Bell,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryTree,
} from "../../redux/slices/categorySlice";
import { useLocation, useNavigate, Link } from "react-router-dom";

// AdminSidebar Component
const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    management: false,
    sales: false,
    marketing: false,
    users: false,
  });

  const getCurrentPageInfo = () => {
    const path = location.pathname;
    const pageMap = {
      "/admin/dashboard": {
        label: "Dashboard",
        labelBn: "ড্যাশবোর্ড",
        icon: LayoutDashboard,
      },
      "/admin/order-list": {
        label: "Orders",
        labelBn: "অর্ডারসমূহ",
        icon: ShoppingBag,
      },
      "/admin/products": {
        label: "Products",
        labelBn: "প্রোডাক্টস",
        icon: Package,
      },
      "/admin/courses": {
        label: "Courses",
        labelBn: "কোর্সসমূহ",
        icon: GraduationCap,
      },
      "/admin/categories": {
        label: "Categories",
        labelBn: "ক্যাটাগরিস",
        icon: Layers,
      },
      "/admin/payments": {
        label: "Payments",
        labelBn: "পেমেন্টস",
        icon: CreditCard,
      },
      "/admin/coupons": { label: "Coupons", labelBn: "কুপনস", icon: Percent },
      "/admin/sales-report": {
        label: "Sales Report",
        labelBn: "বিক্রয় রিপোর্ট",
        icon: FileText,
      },
      "/admin/banners": {
        label: "Banners",
        labelBn: "ব্যানারস",
        icon: ImageIcon,
      },
      "/admin/notifications": {
        label: "Notifications",
        labelBn: "নোটিফিকেশন",
        icon: Bell,
      },
      "/admin/userlist": {
        label: "All Users",
        labelBn: "ব্যবহারকারী",
        icon: Users,
      },
    };
    return pageMap[path] || { label: "Admin", labelBn: "অ্যাডমিন", icon: Home };
  };

  const currentPage = getCurrentPageInfo();

  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = { ...expandedSections };
    if (
      [
        "/admin/order-list",
        "/admin/products",
        "/admin/courses",
        "/admin/categories",
      ].some((p) => currentPath.startsWith(p))
    ) {
      newExpanded.management = true;
    }
    if (
      ["/admin/payments", "/admin/coupons", "/admin/sales-report"].some((p) =>
        currentPath.startsWith(p),
      )
    ) {
      newExpanded.sales = true;
    }
    if (
      ["/admin/banners", "/admin/notifications"].some((p) =>
        currentPath.startsWith(p),
      )
    ) {
      newExpanded.marketing = true;
    }
    if (currentPath.startsWith("/admin/userlist")) {
      newExpanded.users = true;
    }
    setExpandedSections(newExpanded);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isActiveRoute = (path) => location.pathname === path;
  const isInSection = (paths) =>
    paths.some((p) => location.pathname.startsWith(p));

  const sidebarSections = [
    {
      id: "dashboard",
      label: "Dashboard / ড্যাশবোর্ড",
      icon: LayoutDashboard,
      to: "/admin/dashboard",
      type: "single",
    },
    {
      id: "management",
      label: "Management / ম্যানেজমেন্ট",
      icon: Store,
      type: "group",
      items: [
        {
          to: "/admin/order-list",
          icon: ShoppingBag,
          label: "Orders / অর্ডারসমূহ",
        },
        {
          to: "/admin/products",
          icon: Package,
          label: "Products / প্রোডাক্টস",
        },
        {
          to: "/admin/courses",
          icon: GraduationCap,
          label: "Courses / কোর্সসমূহ",
        },
        {
          to: "/admin/categories",
          icon: Layers,
          label: "Categories / ক্যাটাগরিস",
        },
      ],
    },
    {
      id: "sales",
      label: "Sales / বিক্রয়",
      icon: DollarSign,
      type: "group",
      items: [
        {
          to: "/admin/payments",
          icon: CreditCard,
          label: "Payments / পেমেন্টস",
        },
        { to: "/admin/coupons", icon: Percent, label: "Coupons / কুপনস" },
        {
          to: "/admin/sales-report",
          icon: FileText,
          label: "Sales Report / বিক্রয় রিপোর্ট",
        },
      ],
    },
    {
      id: "marketing",
      label: "Marketing / মার্কেটিং",
      icon: BarChart3,
      type: "group",
      items: [
        { to: "/admin/banners", icon: ImageIcon, label: "Banners / ব্যানারস" },
        {
          to: "/admin/notifications",
          icon: Bell,
          label: "Notifications / নোটিফিকেশন",
        },
      ],
    },
    {
      id: "users",
      label: "Users / ইউজারস",
      icon: Users,
      type: "group",
      items: [
        {
          to: "/admin/userlist",
          icon: Layers,
          label: "All Users / ব্যবহারকারী",
        },
      ],
    },
  ];

  return (
    <div className="">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] xl:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 z-[70] top-0 border-r border-neutral-200 bg-white flex flex-col transition-all duration-300 ease-out shadow-2xl h-screen ${
          sidebarOpen
            ? "w-72 translate-x-0"
            : "w-0 -translate-x-full xl:w-20 xl:translate-x-0 overflow-hidden xl:overflow-visible"
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-neutral-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="xl:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb Header */}
        {sidebarOpen && (
          <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-white border-b border-violet-100">
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-4 h-4 text-violet-500" />
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <currentPage.icon className="w-4 h-4 text-violet-600" />
              <span className="font-medium text-violet-700 truncate">
                {currentPage.labelBn}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 ml-6">
              {currentPage.label}
            </p>
          </div>
        )}

        {/* Toggle Button - Desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden xl:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-violet-200 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:border-violet-300 transition-all duration-200 z-50"
        >
          <ChevronRight
            className={`w-4 h-4 text-violet-600 transition-transform duration-200 ${sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
          {sidebarSections.map((section, index) => {
            const delay = index * 50;
            if (section.type === "single") {
              const isActive = isActiveRoute(section.to);
              return (
                <Link
                  key={section.id}
                  to={section.to}
                  onClick={() =>
                    window.innerWidth < 1280 && setSidebarOpen(false)
                  }
                  className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-violet-50 text-violet-700 shadow-sm"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-violet-600"
                  } ${!sidebarOpen ? "xl:justify-center" : ""}`}
                  style={{ animationDelay: `${delay}ms` }}
                  title={!sidebarOpen ? section.label : ""}
                >
                  <section.icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-violet-600" : "text-neutral-400 group-hover:text-violet-500"}`}
                  />
                  <span
                    className={`ml-3 whitespace-nowrap transition-all duration-200 ${sidebarOpen ? "opacity-100 max-w-full" : "xl:opacity-0 xl:max-w-0 xl:overflow-hidden"}`}
                  >
                    {section.label}
                  </span>
                  {isActive && sidebarOpen && (
                    <div className="ml-auto w-1.5 h-1.5 bg-amber-500 rounded-full shadow-sm flex-shrink-0" />
                  )}
                </Link>
              );
            }

            const isSectionActive = isInSection(section.items.map((i) => i.to));
            const isExpanded = expandedSections[section.id] || isSectionActive;

            return (
              <div
                key={section.id}
                className="space-y-1"
                style={{ animationDelay: `${delay}ms` }}
              >
                <button
                  onClick={() => sidebarOpen && toggleSection(section.id)}
                  className={`w-full group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isSectionActive
                      ? "bg-neutral-100 text-violet-700"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-violet-600"
                  } ${!sidebarOpen ? "xl:justify-center" : ""}`}
                  title={!sidebarOpen ? section.label : ""}
                >
                  <section.icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isSectionActive ? "text-violet-600" : "text-neutral-400 group-hover:text-violet-500"}`}
                  />
                  {sidebarOpen ? (
                    <>
                      <span className="ml-3 flex-1 text-left truncate">
                        {section.label}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? "rotate-180 text-violet-500" : ""}`}
                      />
                    </>
                  ) : (
                    <span className="xl:hidden ml-3 truncate">
                      {section.label}
                    </span>
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen && isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="pl-4 space-y-1 mt-1 ml-4 border-l-2 border-violet-200">
                    {section.items.map((item) => {
                      const isItemActive = isActiveRoute(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() =>
                            window.innerWidth < 1280 && setSidebarOpen(false)
                          }
                          className={`group flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                            isItemActive
                              ? "bg-violet-50 text-violet-700 border-l-2 border-violet-500 -ml-[2px]"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-violet-600"
                          }`}
                        >
                          <item.icon
                            className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors ${isItemActive ? "text-violet-500" : "text-neutral-400 group-hover:text-violet-400"}`}
                          />
                          <span className="truncate">{item.label}</span>
                          {isItemActive && (
                            <div className="ml-auto w-1 h-1 bg-amber-500 rounded-full flex-shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`group flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 ${sidebarOpen ? "space-x-3" : "xl:justify-center"}`}
            title={!sidebarOpen ? "Logout / লগআউট" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            {sidebarOpen && <span>Logout / লগআউট</span>}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div
        className={`flex-shrink-0 transition-all duration-300 hidden xl:block ${sidebarOpen ? "w-72" : "w-20"}`}
      />
    </div>
  );
};

// Main ManageCategories Component
const ManageCategories = () => {
  const dispatch = useDispatch();
  const { treeStructure: categories, loading } = useSelector(
    (state) => state.category,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Breadcrumb State
  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: "Dashboard", labelBn: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  ]);

  // Image States
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);

  // Form Errors
  const [errors, setErrors] = useState({});

  // Form Initial State
  const getInitialFormState = useCallback(
    () => ({
      "name[bn]": "",
      "name[en]": "",
      slug: "",
      "description[bn]": "",
      "description[en]": "",
      parentCategory: "",
      type: "product",
      icon: "",
      isActive: true,
      displayOrder: 0,
      metaTitle: "",
      metaDescription: "",
      featuredImage: { public_id: "", url: "" },
      bannerImage: { public_id: "", url: "" },
      courseCount: 0,
    }),
    [],
  );

  const [formData, setFormData] = useState(getInitialFormState());

  // Generate slug from English name
  const generateSlug = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Flatten categories for parent dropdown
  const flattenCategories = (cats, excludeId = null, depth = 0) => {
    const result = [];
    cats?.forEach((cat) => {
      if (cat._id !== excludeId) {
        result.push({
          _id: cat._id,
          name: cat.name?.en || cat.name?.bn || "Unnamed",
          depth,
        });
        if (cat.subCategories?.length) {
          result.push(
            ...flattenCategories(cat.subCategories, excludeId, depth + 1),
          );
        }
      }
    });
    return result;
  };

  // Get descendant IDs
  const getDescendantIds = (category) => {
    const ids = [];
    const traverse = (cats) => {
      cats?.forEach((cat) => {
        ids.push(cat._id);
        if (cat.subCategories?.length) traverse(cat.subCategories);
      });
    };
    if (category?.subCategories) traverse(category.subCategories);
    return ids;
  };

  // Toggle category expansion
  const toggleExpand = (catId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(catId)) newSet.delete(catId);
      else newSet.add(catId);
      return newSet;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Expand all parents of search results
  useEffect(() => {
    if (searchQuery && categories.length) {
      const findParents = (cats, targetId, parents = []) => {
        for (const cat of cats) {
          if (cat._id === targetId) return parents;
          if (cat.subCategories?.length) {
            const found = findParents(cat.subCategories, targetId, [
              ...parents,
              cat._id,
            ]);
            if (found) return found;
          }
        }
        return null;
      };

      const matches = [];
      const findMatches = (cats) => {
        cats.forEach((cat) => {
          const nameMatch =
            (cat.name?.en || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (cat.name?.bn || "").includes(searchQuery);
          if (nameMatch) matches.push(cat._id);
          if (cat.subCategories?.length) findMatches(cat.subCategories);
        });
      };
      findMatches(categories);

      const toExpand = new Set();
      matches.forEach((id) => {
        const parents = findParents(categories, id);
        parents?.forEach((p) => toExpand.add(p));
        toExpand.add(id);
      });
      setExpandedCategories(toExpand);
    }
  }, [searchQuery, categories]);

  // Reset form
  const resetForm = () => {
    setFormData(getInitialFormState());
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setErrors({});
  };

  // Handle add
  const handleAdd = (parentId = null) => {
    resetForm();
    if (parentId)
      setFormData((prev) => ({ ...prev, parentCategory: parentId }));
    setEditingCategory(null);
    setShowModal(true);
  };

  // Handle edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      "name[bn]": category.name?.bn || "",
      "name[en]": category.name?.en || "",
      slug: category.slug || "",
      "description[bn]": category.description?.bn || "",
      "description[en]": category.description?.en || "",
      parentCategory:
        category.parentCategory?._id || category.parentCategory || "",
      type: category.type || "product",
      icon: category.icon || "",
      isActive: category.isActive ?? true,
      displayOrder: category.displayOrder || 0,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
      featuredImage: category.featuredImage || { public_id: "", url: "" },
      bannerImage: category.bannerImage || { public_id: "", url: "" },
      courseCount: category.courseCount || 0,
    });
    setFeaturedImagePreview(category.featuredImage?.url || null);
    setBannerImagePreview(category.bannerImage?.url || null);
    setFeaturedImageFile(null);
    setBannerImageFile(null);
    setShowModal(true);
    setActiveDropdown(null);
  };

  // Handle change
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "name[en]" && !editingCategory) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
    if (errors[field])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  };

  // Image handlers
  const handleImageChange = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "featured") {
      setFeaturedImageFile(file);
      setFeaturedImagePreview(URL.createObjectURL(file));
    } else {
      setBannerImageFile(file);
      setBannerImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = (type) => {
    if (type === "featured") {
      setFeaturedImageFile(null);
      setFeaturedImagePreview(null);
      setFormData((prev) => ({
        ...prev,
        featuredImage: { public_id: "", url: "" },
      }));
    } else {
      setBannerImageFile(null);
      setBannerImagePreview(null);
      setFormData((prev) => ({
        ...prev,
        bannerImage: { public_id: "", url: "" },
      }));
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData["name[bn]"]?.trim())
      newErrors["name[bn]"] = "Bengali name is required";
    if (!formData["name[en]"]?.trim())
      newErrors["name[en]"] = "English name is required";
    if (!formData.slug?.trim()) newErrors.slug = "Slug is required";
    if (formData.metaTitle?.length > 70)
      newErrors.metaTitle = "Max 70 characters";
    if (formData.metaDescription?.length > 160)
      newErrors.metaDescription = "Max 160 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value === null || value === undefined) return;
        if (key === "parentCategory" && value === "") return;
        if (typeof value === "object" && !(value instanceof File)) {
          if (value?.public_id) {
            submitData.append(`${key}[public_id]`, value.public_id);
            submitData.append(`${key}[url]`, value.url);
          }
        } else {
          submitData.append(key, value);
        }
      });
      if (featuredImageFile) submitData.append("image", featuredImageFile);
      if (bannerImageFile) submitData.append("bannerImage", bannerImageFile);

      if (editingCategory) {
        await dispatch(
          updateCategory({
            id: editingCategory._id,
            data: submitData,
            isFormData: true,
          }),
        ).unwrap();
      } else {
        await dispatch(
          createCategory({ data: submitData, isFormData: true }),
        ).unwrap();
      }
      setShowModal(false);
      resetForm();
      dispatch(fetchCategoryTree());
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error || "Failed to save" }));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async (category) => {
    if (category.subCategories?.length > 0) {
      alert(`Delete subcategories first`);
      return;
    }
    if (!confirm(`Delete "${category.name?.en || category.name?.bn}"?`)) return;
    try {
      await dispatch(deleteCategory(category._id)).unwrap();
      dispatch(fetchCategoryTree());
    } catch (error) {
      alert(error || "Failed to delete");
    }
    setActiveDropdown(null);
  };

  // Fetch data
  useEffect(() => {
    dispatch(fetchCategoryTree());
    setBreadcrumbs([
      { label: "Dashboard", labelBn: "ড্যাশবোর্ড", path: "/admin/dashboard" },
      { label: "Categories", labelBn: "ক্যাটাগরিস", path: "/admin/categories" },
    ]);
  }, [dispatch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (featuredImagePreview?.startsWith("blob:"))
        URL.revokeObjectURL(featuredImagePreview);
      if (bannerImagePreview?.startsWith("blob:"))
        URL.revokeObjectURL(bannerImagePreview);
    };
  }, [featuredImagePreview, bannerImagePreview]);

  // Toggle dropdown
  const toggleDropdown = (catId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === catId ? null : catId);
  };

  // Render category tree recursively
  const renderCategoryTree = (cats, depth = 0) => {
    return cats?.map((cat) => {
      const isExpanded = expandedCategories.has(cat._id);
      const hasChildren = cat.subCategories?.length > 0;
      const isActive = cat.isActive;

      // Search filter
      if (searchQuery) {
        const nameMatch =
          (cat.name?.en || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (cat.name?.bn || "").includes(searchQuery);
        const childMatch = cat.subCategories?.some(
          (c) =>
            (c.name?.en || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (c.name?.bn || "").includes(searchQuery),
        );
        if (!nameMatch && !childMatch && depth === 0) return null;
      }

      return (
        <div key={cat._id} className="select-none">
          <div
            className={`group flex items-center gap-2 p-3 hover:bg-violet-50 transition-colors border-b border-gray-100 ${depth > 0 ? "ml-8 border-l-2 border-l-violet-200" : ""}`}
            style={{ paddingLeft: `${12 + depth * 24}px` }}
          >
            <button
              onClick={() => hasChildren && toggleExpand(cat._id)}
              className={`w-6 h-6 flex items-center justify-center rounded hover:bg-violet-200 transition-colors ${hasChildren ? "text-violet-600" : "text-transparent"}`}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>

            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-400"}`}
            >
              {hasChildren ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {cat.name?.en}
                </span>
                <span className="text-sm text-gray-500 truncate">
                  ({cat.name?.bn})
                </span>
                {!isActive && (
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="capitalize">{cat.type}</span>
                <span>•</span>
                <span>Order: {cat.displayOrder}</span>
                <span>•</span>
                <span>Courses: {cat.courseCount || 0}</span>
              </div>
            </div>

            {/* Action Buttons - Always visible on mobile, hover on desktop */}
            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleAdd(cat._id)}
                className="p-2 hover:bg-violet-100 text-violet-600 rounded-lg transition-colors"
                title="Add subcategory"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(cat)}
                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cat)}
                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="md:hidden relative">
              <button
                onClick={(e) => toggleDropdown(cat._id, e)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
              {activeDropdown === cat._id && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                  <button
                    onClick={() => handleAdd(cat._id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-violet-50 text-violet-600 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                  <button
                    onClick={() => handleEdit(cat)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {isExpanded && hasChildren && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              {renderCategoryTree(cat.subCategories, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Form field renderer
  const renderField = (label, name, type = "text", options = {}) => {
    const { placeholder, required, maxLength, rows } = options;
    const value = formData[name] || "";
    const error = errors[name];
    const baseClass = `w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all ${error ? "border-red-300" : "border-gray-200"}`;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClass}
            rows={rows || 3}
            maxLength={maxLength}
            placeholder={placeholder}
          />
        ) : type === "select" ? (
          <select
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClass}
          >
            {options.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === "checkbox" ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(name, e.target.checked)}
              className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <span className="text-sm text-gray-600">{placeholder}</span>
          </label>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClass}
            maxLength={maxLength}
            placeholder={placeholder}
            readOnly={options.readOnly}
          />
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {maxLength && (
          <p className="mt-1 text-xs text-gray-400 text-right">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    );
  };

  const availableParents = flattenCategories(
    categories,
    editingCategory?._id,
  ).filter((cat) => {
    if (!editingCategory) return true;
    const descendantIds = getDescendantIds(editingCategory);
    return !descendantIds.includes(cat._id);
  });

  if (loading && !categories.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
          <p className="text-gray-500 text-sm">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Mobile Header */}

      {/* Main Content */}
      <div className="flex-1 xl:ml-0 mt-16 xl:mt-0">
        {/* Breadcrumb Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-4 text-sm">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <Link
                    to={crumb.path}
                    className={`flex items-center gap-1.5 ${idx === breadcrumbs.length - 1 ? "text-violet-700 font-medium" : "text-gray-500 hover:text-violet-600"}`}
                  >
                    {idx === 0 && <Home className="w-4 h-4" />}
                    <span>{crumb.labelBn}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Categories
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                ক্যাটাগরি ব্যবস্থাপনা
              </p>
            </div>
            <button
              onClick={() => handleAdd()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200"
            >
              <Plus className="w-5 h-5" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Filter
                </span>
              </button>
            </div>
          </div>

          {/* Category Tree */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Category Structure
              </span>
              <span className="text-xs text-gray-500">
                {categories?.length || 0} top level
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {categories?.length > 0 ? (
                renderCategoryTree(categories)
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No categories found</p>
                  <button
                    onClick={() => handleAdd()}
                    className="mt-4 text-violet-600 hover:underline text-sm"
                  >
                    Create your first category
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingCategory
                    ? "ক্যাটাগরি সম্পাদনা"
                    : "নতুন ক্যাটাগরি যোগ করুন"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
            >
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" /> {errors.submit}
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-violet-500" /> Basic
                    Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("Name (Bengali)", "name[bn]", "text", {
                      placeholder: "বাংলা নাম",
                      required: true,
                    })}
                    {renderField("Name (English)", "name[en]", "text", {
                      placeholder: "English name",
                      required: true,
                    })}
                  </div>
                  {renderField("Slug", "slug", "text", {
                    placeholder: "category-slug",
                    required: true,
                    readOnly: !editingCategory,
                  })}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("Type", "type", "select", {
                      options: [
                        { value: "product", label: "Product" },
                        { value: "course", label: "Course" },
                        { value: "both", label: "Both" },
                      ],
                    })}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Parent Category
                      </label>
                      <select
                        value={formData.parentCategory}
                        onChange={(e) =>
                          handleChange("parentCategory", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      >
                        <option value="">None (Top Level)</option>
                        {availableParents.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {"—".repeat(cat.depth)} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField(
                      "Description (BN)",
                      "description[bn]",
                      "textarea",
                      { placeholder: "বাংলা বিবরণ", rows: 2 },
                    )}
                    {renderField(
                      "Description (EN)",
                      "description[en]",
                      "textarea",
                      { placeholder: "English description", rows: 2 },
                    )}
                  </div>
                </div>

                {/* SEO */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-violet-500" /> SEO
                    Settings
                  </h3>
                  {renderField("Meta Title", "metaTitle", "text", {
                    placeholder: "SEO Title",
                    maxLength: 70,
                  })}
                  {renderField(
                    "Meta Description",
                    "metaDescription",
                    "textarea",
                    { placeholder: "SEO Description", maxLength: 160, rows: 2 },
                  )}
                </div>

                {/* Images */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-violet-500" /> Images
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["featured", "banner"].map((type) => (
                      <div key={type}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {type} Image
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-violet-400 transition-colors bg-white">
                          {(
                            type === "featured"
                              ? featuredImagePreview
                              : bannerImagePreview
                          ) ? (
                            <div className="relative">
                              <img
                                src={
                                  type === "featured"
                                    ? featuredImagePreview
                                    : bannerImagePreview
                                }
                                alt={type}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(type)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block py-4">
                              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <span className="text-sm text-gray-600">
                                Click to upload
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(type, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MoreVertical className="w-4 h-4 text-violet-500" />{" "}
                    Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderField("Icon", "icon", "text", {
                      placeholder: "Icon name",
                    })}
                    {renderField("Display Order", "displayOrder", "number", {
                      placeholder: "0",
                    })}
                    <div className="flex items-center h-full pt-6">
                      {renderField("", "isActive", "checkbox", {
                        placeholder: "Active (visible to users)",
                      })}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {editingCategory && (
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">
                        Courses:{" "}
                        <strong className="text-violet-700">
                          {formData.courseCount}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 font-medium transition-all active:scale-95"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />{" "}
                      {editingCategory ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
