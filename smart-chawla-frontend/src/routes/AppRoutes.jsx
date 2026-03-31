import { Routes, Route, Link } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import { PageLoader } from "../components/common/Loader";
import { Helmet } from "react-helmet";

// Public Pages
const Home = lazy(() => import("../pages/public/Home"));
const Shop = lazy(() => import("../pages/public/Shop"));
const CourseList = lazy(() => import("../pages/public/CourseList"));
const ProductDetails = lazy(() => import("../pages/public/ProductDetails"));
const CourseDetails = lazy(() => import("../pages/public/CourseDetails"));
const CourseLearn = lazy(() => import("../pages/user/CourseLearn")); // নতুন
const CategoryList = lazy(() => import("../pages/public/CategoryList"));
const CategoryProducts = lazy(() => import("../pages/public/CategoryProducts"));

// Auth Pages
const Register = lazy(() => import("../pages/auth/Register"));
const OTPVerification = lazy(() => import("../pages/auth/OTPVerification"));
const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));

// User Pages
const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
const MyOrders = lazy(() => import("../pages/user/MyOrders"));
const MyCourses = lazy(() => import("../pages/user/MyCourses"));
const Cart = lazy(() => import("../pages/user/Cart"));
const Checkout = lazy(() => import("../pages/user/Checkout"));
const Wishlist = lazy(() => import("../pages/user/Wishlist"));

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageProducts = lazy(() => import("../pages/admin/ManageProducts"));
const ManageCourses = lazy(() => import("../pages/admin/ManageCourses"));
const VerifyPayments = lazy(() => import("../pages/admin/VerifyPayments"));
const ManageCategories = lazy(() => import("../pages/admin/ManageCategories"));
const ManageBanners = lazy(() => import("../pages/admin/ManageBanners"));
const ManageCoupons = lazy(() => import("../pages/admin/ManageCoupons"));
const UserList = lazy(() => import("../pages/admin/UserList"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Helmet>
        <title>Smart Chawla | Best E-commerce & Courses in BD</title>
        <meta
          name="description"
          content="Shop exclusive fashion products and premium Tea courses at Smart Chawla."
        />
        <link rel="canonical" href="https://smart-chawla.vercel.app" />
      </Helmet>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/course/:slug" element={<CourseDetails />} />
        <Route
          path="/course/:slug/preview"
          element={<CourseDetails preview={true} />}
        />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/category/:slug" element={<CategoryProducts />} />

        {/* Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/course/:slug/learn" element={<CourseLearn />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ManageProducts />} />
          <Route path="/admin/courses" element={<ManageCourses />} />
          <Route path="/admin/payments" element={<VerifyPayments />} />
          <Route path="/admin/categories" element={<ManageCategories />} />
          <Route path="/admin/banners" element={<ManageBanners />} />
          <Route path="/admin/coupons" element={<ManageCoupons />} />
          <Route path="/admin/order-list" element={<ManageOrders />} />
          <Route path="/admin/userlist" element={<UserList />} />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <h1 className="text-4xl font-bold text-gray-800">404</h1>
              <p className="text-gray-500 mt-2">
                Oops! The page you are looking for doesn't exist.
              </p>
              <Link
                to="/"
                className="mt-6 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 active:scale-95 transition-all"
              >
                Back to Home
              </Link>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
