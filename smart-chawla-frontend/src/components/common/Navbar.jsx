import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Heart,
  Package,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice";
import CategoryDropdown from "../category/CategoryDropdown";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const categories = [];
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const cartItemCount = cartItems.length;
  const wishlistCount = wishlistItems.length;

  // Handle scroll with smooth transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetchSearchSuggestions();
      } else {
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSearchSuggestions = async () => {
    try {
      const response = await fetch(
        `/api/v1/products/search-suggestions?q=${searchQuery}`,
      );
      const data = await response.json();
      if (data.success) {
        setSearchSuggestions(data.products);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
      setSearchQuery("");
      setIsSearchFocused(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setIsUserMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Sparkles },
    { name: "Shop", href: "/shop", icon: TrendingUp },
    { name: "Courses", href: "/courses", icon: Zap },
  ];

  // Animation variants
  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl shadow-premium border-b border-primary-100"
          : "bg-white/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with hover effect */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300 transform group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-bold text-xl drop-shadow-md">
                S
              </span>
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent hidden sm:block font-bangla tracking-tight">
              Smart Chawla
            </span>
          </Link>

          {/* Desktop Navigation with hover animations */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;

              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onMouseEnter={() => setHoveredNav(link.name)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 group ${
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-neutral-800 hover:text-primary-600 hover:bg-primary-50/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-300 ${
                      hoveredNav === link.name ? "scale-110 rotate-12" : ""
                    } ${isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-primary-500"}`}
                  />
                  <span>{link.name}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full animate-fade-in" />
                  )}

                  {/* Hover glow effect */}
                  <span
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400/0 via-primary-400/10 to-primary-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isActive ? "hidden" : ""}`}
                  />
                </Link>
              );
            })}

            {/* Category Dropdown with enhanced styling */}
            <div className="relative group">
              <CategoryDropdown />
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div
            ref={searchRef}
            className="hidden md:flex flex-1 max-w-lg mx-8 relative"
          >
            <form onSubmit={handleSearch} className="w-full">
              <div
                className={`relative group transition-all duration-300 ${
                  isSearchFocused ? "transform scale-[1.02]" : ""
                }`}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setShowSuggestions(true);
                    setIsSearchFocused(true);
                  }}
                  placeholder="পণ্য খুঁজুন..."
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl border-2 transition-all duration-300 bg-neutral-50 font-bangla text-sm ${
                    isSearchFocused
                      ? "border-primary-400 bg-white shadow-glow ring-4 ring-primary-100"
                      : "border-neutral-200 hover:border-primary-300 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                  }`}
                />
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                    isSearchFocused
                      ? "text-primary-500 scale-110"
                      : "text-neutral-400 group-hover:text-primary-400"
                  }`}
                />

                {/* Search shortcut hint */}
                <kbd
                  className={`absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block px-2 py-0.5 text-xs font-mono text-neutral-400 bg-neutral-100 rounded-md border border-neutral-200 transition-opacity duration-300 ${
                    isSearchFocused ? "opacity-0" : "opacity-100"
                  }`}
                >
                  ⌘K
                </kbd>
              </div>
            </form>

            {/* Enhanced Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-premium border border-primary-100 overflow-hidden animate-slide-up">
                <div className="px-4 py-2 bg-primary-50/50 border-b border-primary-100">
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">
                    সাজেশন
                  </p>
                </div>
                {searchSuggestions.map((product, index) => (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug}`}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center px-4 py-3 hover:bg-primary-50 transition-all duration-200 group border-b border-neutral-50 last:border-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shadow-soft group-hover:shadow-md transition-shadow duration-200">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-neutral-800 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-primary-600 mt-0.5">
                        ৳{product.price}
                      </p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions with enhanced interactions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 rounded-xl text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
            >
              <Heart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:fill-primary-100" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-fade-in ring-2 ring-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart with enhanced badge */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300 group"
            >
              <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-accent to-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-fade-in ring-2 ring-white">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu with enhanced dropdown */}
            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative ml-2">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center space-x-2 p-1.5 pr-3 rounded-2xl transition-all duration-300 ${
                    isUserMenuOpen
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-200"
                      : "hover:bg-neutral-100 text-neutral-700 hover:text-primary-600"
                  }`}
                >
                  {user?.avatar ? (
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shadow-md"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary-500 border-2 border-white rounded-full" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center ring-2 ring-white shadow-md">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">
                    {user?.fullName?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Enhanced User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-premium border border-primary-100 overflow-hidden animate-slide-up">
                    {/* User Header */}
                    <div className="px-5 py-4 bg-gradient-to-br from-primary-50 to-white border-b border-primary-100">
                      <div className="flex items-center space-x-3">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-200 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-800 truncate">
                            {user?.fullName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="font-medium">ড্যাশবোর্ড</span>
                      </Link>

                      <Link
                        to="/my-orders"
                        className="flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center mr-3 group-hover:bg-secondary-100 transition-colors">
                          <Package className="w-4 h-4 text-secondary-600" />
                        </div>
                        <span className="font-medium">আমার অর্ডার</span>
                      </Link>

                      <Link
                        to="/my-courses"
                        className="flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mr-3 group-hover:bg-amber-100 transition-colors">
                          <BookOpen className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="font-medium">আমার কোর্স</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center mr-3 group-hover:bg-rose-100 transition-colors">
                            <Heart className="w-4 h-4 text-rose-500" />
                          </div>
                          <span className="font-medium">উইশলিস্ট</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-600 rounded-full">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group border border-primary-200 mt-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                            <LayoutDashboard className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="font-medium">এডমিন প্যানেল</span>
                          <Zap className="w-3 h-3 ml-auto text-primary-400" />
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-neutral-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
                          <LogOut className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="font-medium">লগআউট</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-glow transform hover:-translate-y-0.5 font-medium text-sm"
              >
                <User className="w-4 h-4 mr-2" />
                লগইন
              </Link>
            )}

            {/* Mobile Menu Button with animation */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-neutral-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
            >
              <div className="relative w-6 h-6">
                <span
                  className={`absolute left-0 block w-6 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "top-3 rotate-45" : "top-1"}`}
                />
                <span
                  className={`absolute left-0 top-3 block w-6 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`absolute left-0 block w-6 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "top-3 -rotate-45" : "top-5"}`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-primary-100 shadow-premium animate-slide-up">
          <div className="px-4 py-6 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-neutral-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-300 font-bangla"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            </form>

            {/* Mobile Nav Links */}
            <div className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary-50 text-primary-600 border border-primary-200"
                        : "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 ${isActive ? "text-primary-500" : "text-neutral-400"}`}
                    />
                    <span className="font-medium font-bangla">{link.name}</span>
                    {isActive && (
                      <Sparkles className="w-4 h-4 ml-auto text-primary-400" />
                    )}
                  </Link>
                );
              })}

              {/* Mobile Categories */}
              <div className="px-4 py-3">
                <p className="font-semibold text-neutral-900 mb-3 font-bangla flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-2 text-primary-500" />
                  ক্যাটাগরি
                </p>
                <div className="pl-4 space-y-2 border-l-2 border-primary-100">
                  {categories?.map((category) => (
                    <Link
                      key={category._id}
                      to={`/category/${category.slug}`}
                      className="block py-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors font-bangla"
                    >
                      {category.name.bn || category.name.en}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full px-4 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-lg"
                >
                  <User className="w-5 h-5 mr-2" />
                  লগইন
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center w-full px-4 py-3.5 border-2 border-primary-200 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors"
                >
                  নতুন অ্যাকাউন্ট
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
