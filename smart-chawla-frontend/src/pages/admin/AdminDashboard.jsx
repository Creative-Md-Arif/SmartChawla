import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  RefreshCw,
  Menu,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { formatPrice } from "../../utils/formatters";
import { PageLoader } from "../../components/common/Loader";
import AdminSidebar from "./AdminSidebar";

import {
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCourses: 0,
    totalRevenue: 0,
    netRevenue: 0,
    totalDiscounts: 0,
    pendingVerifications: 0,
  });
  const [charts, setCharts] = useState({
    salesData: [],
    orderStatusData: [],
    topCategories: [],
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [activeChart, setActiveChart] = useState("revenue");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/dashboard?days=${timeRange}`);
      
      setStats(response.data.stats || {});
      setCharts(response.data.charts || {
        salesData: [],
        orderStatusData: [],
        topCategories: [],
      });
      setRecentUsers(response.data.recentUsers || []);
      setLowStockProducts(response.data.lowStockProducts || []);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardStats();
  };

  const COLORS = {
    primary: "#7c3aed",
    secondary: "#22c55e",
    accent: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    purple: "#8b5cf6",
    pink: "#ec4899",
  };

  const STATUS_COLORS = {
    Pending: "#f59e0b",
    Verified: "#7c3aed",
    Rejected: "#ef4444",
    Processing: "#8b5cf6",
    Shipped: "#06b6d4",
    Delivered: "#22c55e",
    Completed: "#16a34a",
    Cancelled: "#6b7280",
  };

  if (loading && !isRefreshing) return <PageLoader />;

  const statCards = [
    {
      name: "Total Revenue",
      nameBn: "মোট আয়",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      gradient: "from-violet-600 to-violet-800",
      lightColor: "bg-violet-50",
      textColor: "text-violet-700",
      trend: "+12%",
      trendUp: true,
      subtext: `Net: ${formatPrice(stats.netRevenue)}`,
      subtextBn: `নেট: ${formatPrice(stats.netRevenue)}`,
    },
    {
      name: "Total Orders",
      nameBn: "মোট অর্ডার",
      value: stats.totalOrders?.toLocaleString() || "0",
      icon: ShoppingBag,
      gradient: "from-emerald-500 to-emerald-700",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      trend: "+5%",
      trendUp: true,
      subtext: `${stats.pendingVerifications || 0} pending`,
      subtextBn: `${stats.pendingVerifications || 0} অপেক্ষমাণ`,
    },
    {
      name: "Total Users",
      nameBn: "মোট ইউজার",
      value: stats.totalUsers?.toLocaleString() || "0",
      icon: Users,
      gradient: "from-blue-500 to-blue-700",
      lightColor: "bg-blue-50",
      textColor: "text-blue-700",
      trend: "+8%",
      trendUp: true,
      subtext: "Active now",
      subtextBn: "সক্রিয়",
    },
    {
      name: "Pending Verification",
      nameBn: "অপেক্ষমাণ ভেরিফিকেশন",
      value: stats.pendingVerifications || 0,
      icon: CreditCard,
      gradient: "from-amber-500 to-orange-600",
      lightColor: "bg-amber-50",
      textColor: "text-amber-700",
      trend: "Action needed",
      trendBn: "মনোযোগ দিন",
      trendUp: null,
      alert: stats.pendingVerifications > 0,
    },
  ];

  const salesChartData = charts.salesData.map((item) => ({
    date: item._id,
    sales: item.sales || 0,
    orders: item.orders || 0,
  }));

  const statusChartData = charts.orderStatusData.map((item) => ({
    name: item._id,
    value: item.count,
    color: STATUS_COLORS[item._id] || "#8884d8",
  }));

  const categoryChartData = charts.topCategories.map((item) => ({
    name: item._id || "Uncategorized / অবর্গীকৃত",
    sales: item.totalSales || 0,
    count: item.count || 0,
  }));

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans pt-5">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 min-w-0 overflow-x-hidden transition-all duration-300 border-t-2">
        {/* Header - Fixed sticky and z-index */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200 shadow-sm">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-neutral-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all duration-200 active:scale-95 xl:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900">Dashboard / <span className="font-bangla">ড্যাশবোর্ড</span></h1>
                <p className="text-xs text-neutral-500 hidden sm:block">
                  Welcome back! / <span className="font-bangla">স্বাগতম!</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex bg-neutral-100 rounded-lg p-1">
                {[
                  { value: "7", label: "7D", labelBn: "৭ দিন" },
                  { value: "30", label: "30D", labelBn: "৩০ দিন" },
                  { value: "90", label: "90D", labelBn: "৯০ দিন" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      timeRange === option.value
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                    title={option.labelBn}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button className="relative p-2 text-neutral-500 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all duration-200">
                <Bell className="w-5 h-5" />
                {stats.pendingVerifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                )}
              </button>

              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 text-neutral-500 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all duration-200 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Time Range - Fixed padding and layout */}
          <div className="sm:hidden px-4 pb-3 border-t border-neutral-100 pt-3">
            <div className="flex bg-neutral-100 rounded-lg p-1">
              {[
                { value: "7", label: "7D", labelBn: "৭ দিন" },
                { value: "30", label: "30D", labelBn: "৩০ দিন" },
                { value: "90", label: "90D", labelBn: "৯০ দিন" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    timeRange === option.value
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-neutral-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content - Fixed padding and spacing */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats Grid - Fixed responsive columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {statCards.map((stat, index) => (
              <div
                key={stat.name}
                className={`group relative bg-white rounded-2xl p-5 border ${
                  stat.alert ? "border-amber-300 ring-1 ring-amber-100" : "border-neutral-200"
                } shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium mb-1">
                      {stat.name} / <span className="font-bangla text-[10px]">{stat.nameBn}</span>
                    </p>
                    <p className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-1 truncate">
                      {stat.value}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {stat.subtext} / <span className="font-bangla">{stat.subtextBn || stat.subtext}</span>
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="relative mt-4 flex items-center gap-1.5">
                  {stat.trendUp === true ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : stat.trendUp === false ? (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trendUp === true
                        ? "text-emerald-600"
                        : stat.trendUp === false
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {stat.trend} {stat.trendBn && `/ ${stat.trendBn}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section - Fixed grid and heights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Chart - Fixed responsive height */}
            <div className="xl:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Revenue & Orders / <span className="font-bangla">আয় ও অর্ডার</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Daily performance / <span className="font-bangla">দৈনিক পরিসংখ্যান</span>
                  </p>
                </div>
                <div className="flex bg-neutral-100 rounded-lg p-1 self-start">
                  <button
                    onClick={() => setActiveChart("revenue")}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                      activeChart === "revenue"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Revenue / <span className="font-bangla text-xs">আয়</span>
                  </button>
                  <button
                    onClick={() => setActiveChart("orders")}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                      activeChart === "orders"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Orders / <span className="font-bangla text-xs">অর্ডার</span>
                  </button>
                </div>
              </div>
              
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                      width={45}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [
                        name === "sales" ? formatPrice(value) : value,
                        name === "sales" ? "Revenue / আয়" : "Orders / অর্ডার",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      name="Revenue / আয়"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="orders"
                      fill={COLORS.secondary}
                      radius={[4, 4, 0, 0]}
                      name="Orders / অর্ডার"
                      maxBarSize={35}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status - Fixed layout */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Order Status / <span className="font-bangla">অর্ডার স্ট্যাটাস</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Distribution / <span className="font-bangla">বিতরণ</span>
                  </p>
                </div>
                <PieChartIcon className="w-5 h-5 text-neutral-400" />
              </div>
              
              <div className="h-48 sm:h-56 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 space-y-2 max-h-28 sm:max-h-32 overflow-y-auto">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center min-w-0">
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-neutral-600 truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-neutral-900 ml-2">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid - Fixed responsive columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Top Categories */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Top Categories / <span className="font-bangla">শীর্ষ ক্যাটাগরি</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    By revenue / <span className="font-bangla">আয় অনুযায়ী</span>
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-neutral-400" />
              </div>
              
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [formatPrice(value), "Revenue / আয়"]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      fill={COLORS.primary}
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Recent Users / <span className="font-bangla">নতুন ইউজার</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    New registrations / <span className="font-bangla">সাম্প্রতিক নিবন্ধন</span>
                  </p>
                </div>
                <Users className="w-5 h-5 text-neutral-400" />
              </div>
              
              <div className="space-y-3">
                {recentUsers.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-sm font-semibold text-violet-700">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {user.fullName || "Unknown / অজানা"}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                
                {recentUsers.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">
                      No users / <span className="font-bangla">কোনো ইউজার নেই</span>
                    </p>
                  </div>
                )}
              </div>
              
              <Link
                to="/admin/userlist"
                className="mt-4 block text-center text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                View all / <span className="font-bangla">সব দেখুন</span> →
              </Link>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200 shadow-sm md:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Low Stock / <span className="font-bangla">কম স্টক</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500">
                    Needs attention / <span className="font-bangla">মনোযোগ প্রয়োজন</span>
                  </p>
                </div>
                <Package className="w-5 h-5 text-neutral-400" />
              </div>
              
              <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-2.5 sm:p-3 bg-red-50 rounded-xl border border-red-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                      <p className="text-xs text-neutral-500">SKU: {product.sku}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {product.stock === 0 ? "Out / শেষ" : product.stock}
                    </span>
                  </div>
                ))}
                
                {lowStockProducts.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">
                      All in stock! / <span className="font-bangla">সব স্টকে আছে!</span>
                    </p>
                  </div>
                )}
              </div>
              
              <Link
                to="/admin/products"
                className="mt-4 block text-center text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                Manage / <span className="font-bangla">ম্যানেজ</span> →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;