import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ShoppingBag, BookOpen, Star, Truck, Shield, Headphones, Tag, Clock, Percent } from 'lucide-react';
import HeroBanner from '../../components/banner/HeroBanner';
import ProductCard from '../../components/cards/ProductCard';
import CourseCard from '../../components/cards/CourseCard';
import { fetchCategories } from '../../redux/slices/categorySlice';
import axiosInstance from '../../utils/axiosInstance';

const Home = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [countdown, setCountdown] = useState({});

  useEffect(() => {
    dispatch(fetchCategories());
    fetchFeaturedData();
    fetchActivePromotions();
  }, [dispatch]);

  // Countdown timer for promotions
  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdown = {};
      activePromotions.forEach(promo => {
        if (promo.validUntil) {
          const diff = new Date(promo.validUntil) - new Date();
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            newCountdown[promo._id] = { days, hours, minutes, seconds };
          }
        }
      });
      setCountdown(newCountdown);
    }, 1000);

    return () => clearInterval(timer);
  }, [activePromotions]);

  const fetchFeaturedData = async () => {
    try {
      const [productsRes, coursesRes] = await Promise.all([
        axiosInstance.get('/products/featured?limit=8'),
        axiosInstance.get('/courses?limit=4'),
      ]);
      setFeaturedProducts(productsRes.data.products || []);
      setPopularCourses(coursesRes.data.courses || []);
    } catch (error) {
      console.error('Error fetching featured data:', error);
    }
  };

  const fetchActivePromotions = async () => {
    try {
      // Fetch active auto-apply coupons with high priority
      const response = await axiosInstance.get('/coupons', {
        params: { status: 'active', limit: 3 }
      });
      
      // Filter for high priority or auto-apply coupons
      const promotions = (response.data.coupons || [])
        .filter(coupon => coupon.autoApply || coupon.priority >= 5)
        .slice(0, 2);
      
      setActivePromotions(promotions);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders over ৳1000' },
    { icon: Shield, title: 'Secure Payment', description: '100% secure checkout' },
    { icon: Headphones, title: '24/7 Support', description: 'Dedicated support' },
    { icon: Star, title: 'Quality Products', description: 'Verified sellers' },
  ];

  // Countdown component
  const CountdownDisplay = ({ time }) => {
    if (!time) return null;
    return (
      <div className="flex gap-2 text-center">
        {time.days > 0 && (
          <div className="bg-white/20 rounded p-2 min-w-[50px]">
            <div className="text-xl font-bold">{String(time.days).padStart(2, '0')}</div>
            <div className="text-xs">Days</div>
          </div>
        )}
        <div className="bg-white/20 rounded p-2 min-w-[50px]">
          <div className="text-xl font-bold">{String(time.hours).padStart(2, '0')}</div>
          <div className="text-xs">Hrs</div>
        </div>
        <div className="bg-white/20 rounded p-2 min-w-[50px]">
          <div className="text-xl font-bold">{String(time.minutes).padStart(2, '0')}</div>
          <div className="text-xs">Min</div>
        </div>
        <div className="bg-white/20 rounded p-2 min-w-[50px]">
          <div className="text-xl font-bold">{String(time.seconds).padStart(2, '0')}</div>
          <div className="text-xs">Sec</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroBanner />
      </section>

      {/* 🎯 PROMOTIONAL BANNERS / ADS SECTION */}
      {activePromotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePromotions.map((promo, index) => (
              <div
                key={promo._id}
                className={`relative overflow-hidden rounded-2xl p-6 md:p-8 ${
                  index === 0 
                    ? 'bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800' 
                    : 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600'
                } text-white shadow-xl transform hover:scale-[1.02] transition-transform duration-300`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5" />
                        <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                          {promo.firstOrderOnly ? 'First Order Special' : 'Limited Time Offer'}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">
                        {promo.discountType === 'percentage' 
                          ? `${promo.discountValue}% OFF` 
                          : `৳${promo.discountValue} OFF`}
                      </h3>
                      <p className="text-white/90 text-lg mb-1">
                        Use code: <code className="bg-white/20 px-3 py-1 rounded-lg font-mono font-bold text-yellow-300">{promo.code}</code>
                      </p>
                      {promo.minPurchase > 0 && (
                        <p className="text-sm text-white/80">
                          On orders above ৳{promo.minPurchase}
                        </p>
                      )}
                    </div>
                    <div className="hidden md:block">
                      <Percent className="w-16 h-16 text-white/20" />
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  {promo.validUntil && countdown[promo._id] && (
                    <div className="mb-4">
                      <p className="text-sm text-white/80 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Offer ends in:
                      </p>
                      <CountdownDisplay time={countdown[promo._id]} />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm text-white/80">
                      {promo.usageLimit 
                        ? `${promo.usageLimit - (promo.usedCount || 0)} coupons left` 
                        : 'Unlimited use'}
                    </p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center px-6 py-2 bg-white text-purple-700 font-semibold rounded-lg hover:bg-yellow-300 hover:text-purple-800 transition-colors"
                    >
                      Shop Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{feature.title}</p>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
          <Link to="/categories" className="text-purple-600 hover:text-purple-700 flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category._id}
              to={`/category/${category.slug}`}
              className="group bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                {category.featuredImage?.url ? (
                  <img
                    src={category.featuredImage.url}
                    alt={category.name.en}
                    className="w-10 h-10 object-cover rounded-full"
                  />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-purple-600" />
                )}
              </div>
              <p className="font-medium text-gray-900">{category.name.bn || category.name.en}</p>
              <p className="text-sm text-gray-500">{category.productCount || 0} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/shop" className="text-purple-600 hover:text-purple-700 flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 🎯 MIDDLE PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🎓 Special Student Discount!
            </h2>
            <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              Enroll in any course today and get an additional 15% off on all physical products. 
              Use code <code className="bg-white/20 px-2 py-1 rounded text-yellow-300 font-bold">STUDENT15</code>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/courses"
                className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-yellow-300 hover:text-purple-800 transition-colors shadow-lg"
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                Browse Courses
              </Link>
              <Link
                to="/shop"
                className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 inline mr-2" />
                Shop Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Popular Courses</h2>
          <Link to="/courses" className="text-purple-600 hover:text-purple-700 flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Learning Today!
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students learning new skills. Get access to premium courses
            taught by industry experts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/courses"
              className="px-8 py-3 bg-white text-purple-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              Browse Courses
            </Link>
            <Link
              to="/shop"
              className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 inline mr-2" />
              Start Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;