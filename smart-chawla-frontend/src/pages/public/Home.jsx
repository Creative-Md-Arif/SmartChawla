import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  ShoppingBag,
  BookOpen,
  Star,
  Truck,
  Shield,
  Headphones,
  Tag,
  Clock,
  Percent,
} from "lucide-react";
import HeroBanner from "../../components/banner/HeroBanner";
import ProductCard from "../../components/cards/ProductCard";
import CourseCard from "../../components/cards/CourseCard";
import { fetchCategories } from "../../redux/slices/categorySlice";
import axiosInstance from "../../utils/axiosInstance";

const Home = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);

  // Loading states
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchCategories());
    fetchFeaturedData();
  }, [dispatch]);

  const fetchFeaturedData = async () => {
    try {
      const [productsRes, coursesRes] = await Promise.all([
        axiosInstance.get("/products/featured?limit=8"),
        axiosInstance.get("/courses?limit=4"),
      ]);
      setFeaturedProducts(productsRes.data.products || []);
      setPopularCourses(coursesRes.data.courses || []);
    } catch (error) {
      console.error("Error fetching featured data:", error);
    } finally {
      setIsProductsLoading(false);
      setIsCoursesLoading(false);
    }
  };

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On Selected Product",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure checkout",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated support",
    },
    { icon: Star, title: "Quality Products", description: "Verified sellers" },
  ];

  // 🎯 EYE-CATCHING SKELETON COMPONENTS

  const shimmerClass =
    "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]";

  const ProductCardSkeleton = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className={`h-40 sm:h-48 ${shimmerClass} rounded-t-xl`} />
      <div className="p-3 sm:p-4 space-y-3">
        <div className={`h-4 ${shimmerClass} rounded w-3/4`} />
        <div className="flex items-center justify-between">
          <div className={`h-5 ${shimmerClass} rounded w-16`} />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-3 h-3 ${shimmerClass} rounded-full`} />
            ))}
          </div>
        </div>
        <div className={`h-9 ${shimmerClass} rounded-lg w-full mt-2`} />
      </div>
    </div>
  );

  const CourseCardSkeleton = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className={`h-36 sm:h-40 ${shimmerClass} rounded-t-xl relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-12 h-12 ${shimmerClass} rounded-full opacity-50`}
          />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className={`h-5 ${shimmerClass} rounded-full w-20`} />
        <div className="space-y-2">
          <div className={`h-4 ${shimmerClass} rounded w-full`} />
          <div className={`h-4 ${shimmerClass} rounded w-2/3`} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 ${shimmerClass} rounded-full`} />
          <div className={`h-3 ${shimmerClass} rounded w-24`} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className={`h-5 ${shimmerClass} rounded w-16`} />
          <div className={`h-4 ${shimmerClass} rounded w-20`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-12">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroBanner />
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {feature.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Browse Categories
          </h2>
          <Link
            to="/categories"
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors duration-300 group"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {!categories || categories.length === 0
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 rounded-lg p-4 animate-pulse"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
                </div>
              ))
            : categories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  className="group bg-white rounded-lg border border-gray-100 p-4 hover:border-purple-200 hover:shadow-md transition-all duration-300 ease-out"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 group-hover:bg-purple-50 flex items-center justify-center transition-colors duration-300">
                    {category.featuredImage?.url ? (
                      <img
                        src={category.featuredImage.url}
                        alt={category.name.en}
                        loading="lazy"
                        fetchpriority="high"
                        className="w-7 h-7 object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center group-hover:text-purple-600 transition-colors duration-300 line-clamp-1">
                    {category.name.bn || category.name.en}
                  </p>
                </Link>
              ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6 gap-2">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            Featured Products
          </h2>
          <Link
            to="/shop"
            className="text-xs sm:text-base text-purple-600 hover:text-purple-700 font-semibold flex items-center flex-shrink-0"
          >
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {isProductsLoading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <ProductCardSkeleton key={`product-skeleton-${idx}`} />
              ))
            : featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </section>

      {/* Middle Promo Banner */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* Fixed height wrapper - CLS ফিক্স */}
        <div className="h-[420px] sm:h-[380px]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 shadow-2xl h-full">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10 px-4 py-10 sm:p-12 text-center h-full flex flex-col justify-center">
              <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-widest text-yellow-300 uppercase bg-white/10 border border-white/20 rounded-full">
                Limited Time Offer
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
                🎓 Special Student <br className="xs:hidden" /> Discount!
              </h2>
              <p className="max-w-md mx-auto mb-8 text-sm sm:text-lg text-indigo-100 leading-relaxed">
                Enroll today and unlock{" "}
                <span className="text-white font-bold underline decoration-yellow-400">
                  15% OFF
                </span>{" "}
                on all products.
                <div className="mt-4 flex items-center justify-center gap-2 bg-black/20 w-fit mx-auto px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-[10px] text-indigo-200 uppercase font-medium">
                    Code:
                  </span>
                  <code className="text-yellow-300 font-mono font-bold text-base tracking-wider">
                    STUDENT15
                  </code>
                </div>
              </p>
              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-[280px] sm:max-w-none mx-auto">
                <Link
                  to="/courses"
                  className="group relative flex items-center justify-center px-6 py-3.5 bg-white text-indigo-700 font-bold rounded-xl transition-all hover:bg-yellow-300 hover:text-indigo-900 shadow-xl active:scale-95 overflow-hidden"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>Browse Courses</span>
                </Link>
                <Link
                  to="/shop"
                  className="flex items-center justify-center px-6 py-3.5 border-2 border-white/30 bg-white/5 text-white font-bold rounded-xl backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  <span>Shop Products</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 gap-2">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            Popular Courses
          </h2>
          <Link
            to="/courses"
            className="text-xs sm:text-base text-purple-600 hover:text-purple-700 font-semibold flex items-center flex-shrink-0"
          >
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          {isCoursesLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <CourseCardSkeleton key={`course-skeleton-${idx}`} />
              ))
            : popularCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fixed height wrapper - CLS ফিক্স */}
        <div className="h-[320px] sm:h-[300px] md:h-[340px]">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 xs:p-8 md:p-12 text-center h-full flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Start Learning Today!
            </h2>
            <p className="text-white/80 text-sm sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students learning new skills. Get access to
              premium courses taught by industry experts.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 sm:space-x-0">
              <Link
                to="/courses"
                className="flex items-center justify-center px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-md"
              >
                <BookOpen className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Browse Courses</span>
              </Link>
              <Link
                to="/shop"
                className="flex items-center justify-center px-6 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95"
              >
                <ShoppingBag className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Start Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
