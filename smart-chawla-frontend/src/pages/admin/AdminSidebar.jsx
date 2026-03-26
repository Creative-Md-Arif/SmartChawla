import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
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
  ImageIcon,
  Bell,
  Users,
  UserCog,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  ChevronRight, // 🔴 [NEW]
  Home, // 🔴 [NEW]
} from "lucide-react";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, navbarHeight = 72 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedSections, setExpandedSections] = useState({
    management: false,
    sales: false,
    marketing: false,
    users: false,
  });

  // 🔴 [NEW] Breadcrumb for sidebar header
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    const pageMap = {
      '/admin/dashboard': { label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      '/admin/order-list': { label: 'Orders', labelBn: 'অর্ডারসমূহ', icon: ShoppingBag },
      '/admin/products': { label: 'Products', labelBn: 'প্রোডাক্টস', icon: Package },
      '/admin/courses': { label: 'Courses', labelBn: 'কোর্সসমূহ', icon: GraduationCap },
      '/admin/categories': { label: 'Categories', labelBn: 'ক্যাটাগরিস', icon: Layers },
      '/admin/payments': { label: 'Payments', labelBn: 'পেমেন্টস', icon: CreditCard },
      '/admin/coupons': { label: 'Coupons', labelBn: 'কুপনস', icon: Percent },
      '/admin/sales-report': { label: 'Sales Report', labelBn: 'বিক্রয় রিপোর্ট', icon: FileText },
      '/admin/banners': { label: 'Banners', labelBn: 'ব্যানারস', icon: ImageIcon },
      '/admin/notifications': { label: 'Notifications', labelBn: 'নোটিফিকেশন', icon: Bell },
      '/admin/userlist': { label: 'All Users', labelBn: 'ব্যবহারকারী', icon: Users },
    };
    return pageMap[path] || { label: 'Admin', labelBn: 'অ্যাডমিন', icon: Home };
  };

  const currentPage = getCurrentPageInfo();

  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = { ...expandedSections };

    if (
      currentPath.startsWith("/admin/order-list") ||
      currentPath.startsWith("/admin/products") ||
      currentPath.startsWith("/admin/courses") ||
      currentPath.startsWith("/admin/categories")
    ) {
      newExpanded.management = true;
    }
    if (
      currentPath.startsWith("/admin/payments") ||
      currentPath.startsWith("/admin/coupons") ||
      currentPath.startsWith("/admin/sales-report")
    ) {
      newExpanded.sales = true;
    }
    if (
      currentPath.startsWith("/admin/banners") ||
      currentPath.startsWith("/admin/notifications")
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
      if (window.innerWidth >= 1280) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
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
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
      {/* Overlay - Improved z-index */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] xl:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive improvements */}
      <aside
        className={`fixed left-0 z-[70] mt-[12px] border-t-2 bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 ease-out shadow-2xl ${
          sidebarOpen
            ? "w-72 translate-x-0"
            : "w-0 -translate-x-full xl:w-20 xl:translate-x-0 overflow-hidden xl:overflow-visible"
        }`}
        style={{
          top: `${navbarHeight}px`,
          height: `calc(100vh - ${navbarHeight}px)`,
        }}
      >
        {/* 🔴 [NEW] Breadcrumb Header - Only when expanded */}
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

        {/* Toggle Button - Desktop only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden xl:flex absolute -right-3 top-4 w-6 h-6 bg-white border border-violet-200 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:border-violet-300 transition-all duration-200 z-50"
        >
          <ChevronLeft
            className={`w-4 h-4 text-violet-600 transition-transform duration-200 ${
              sidebarOpen ? "" : "rotate-180"
            }`}
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
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? "text-violet-600"
                        : "text-neutral-400 group-hover:text-violet-500"
                    }`}
                  />
                  <span
                    className={`ml-3 whitespace-nowrap transition-all duration-200 ${
                      sidebarOpen
                        ? "opacity-100 max-w-full"
                        : "xl:opacity-0 xl:max-w-0 xl:overflow-hidden"
                    }`}
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
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isSectionActive
                        ? "text-violet-600"
                        : "text-neutral-400 group-hover:text-violet-500"
                    }`}
                  />
                  {sidebarOpen ? (
                    <>
                      <span className="ml-3 flex-1 text-left truncate">
                        {section.label}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? "rotate-180 text-violet-500" : ""
                        }`}
                      />
                    </>
                  ) : (
                    <span className="xl:hidden ml-3 truncate">
                      {section.label}
                    </span>
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    sidebarOpen && isExpanded
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
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
                            className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors ${
                              isItemActive
                                ? "text-violet-500"
                                : "text-neutral-400 group-hover:text-violet-400"
                            }`}
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

        {/* User & Logout */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
          
          <button
            onClick={handleLogout}
            className={`group flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 ${
              sidebarOpen ? "space-x-3" : "xl:justify-center"
            }`}
            title={!sidebarOpen ? "Logout / লগআউট" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            {sidebarOpen && <span>Logout / লগআউট</span>}
          </button>
        </div>
      </aside>

      {/* Spacer - Desktop only */}
      <div
        className={`flex-shrink-0 transition-all duration-300 hidden xl:block ${
          sidebarOpen ? "w-72" : "w-20"
        }`}
      />
    </div>
  );
};

export default AdminSidebar;