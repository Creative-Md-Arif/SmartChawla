import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Heart,
  Zap,
  Award,
  TrendingUp,
} from "lucide-react";
import { useSelector } from "react-redux";
import { formatPrice } from "../../utils/formatters";
import WishlistButton from "../common/WishlistButton";
import {
  selectIsEnrolled,
  selectCourseProgress,
} from "../../redux/slices/enrollSlice";

const CourseCard = ({ course, enrolled = false, progress = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Redux থেকে enrollment data নিন
  const isEnrolledRedux = useSelector((state) =>
    selectIsEnrolled(state, course._id),
  );
  const reduxProgress = useSelector((state) =>
    selectCourseProgress(state, course._id),
  );

  // Combine props and Redux data
  const isCourseEnrolled = enrolled || isEnrolledRedux;
  const courseProgress = progress || reduxProgress;

  const discountPercentage = course.discountPrice
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
    : 0;

  const getLevelColor = (level) => {
    const colors = {
      Beginner: "bg-secondary-50 text-secondary-600 border-secondary-200",
      Intermediate: "bg-accent/10 text-amber-600 border-amber-200",
      Advanced: "bg-rose-50 text-rose-600 border-rose-200",
      "All Levels": "bg-primary-50 text-primary-600 border-primary-200",
    };
    return (
      colors[level] || "bg-neutral-100 text-neutral-600 border-neutral-200"
    );
  };

  const getLevelIcon = (level) => {
    const icons = {
      Beginner: <TrendingUp className="w-3 h-3 mr-1" />,
      Intermediate: <Zap className="w-3 h-3 mr-1" />,
      Advanced: <Award className="w-3 h-3 mr-1" />,
      "All Levels": <Star className="w-3 h-3 mr-1" />,
    };
    return icons[level] || null;
  };

  return (
    <div
      className={`
        group relative bg-white rounded-2xl shadow-soft border border-neutral-100 
        overflow-hidden transition-all duration-500 ease-out
        hover:shadow-premium hover:border-primary-200 hover:-translate-y-1
        ${isCourseEnrolled ? "ring-2 ring-primary-100" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <Link
        to={`/course/${course.slug}`}
        className="relative block overflow-hidden"
      >
        <div className="aspect-video overflow-hidden bg-neutral-100 relative group rounded-t-xl sm:rounded-t-2xl">
          {/* Skeleton Loader - SEO: Hidden from screen readers during loading */}
          {!isImageLoaded && (
            <div
              className="absolute inset-0 bg-neutral-200 animate-pulse z-10"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ backgroundSize: "200% 100%" }}
              />
            </div>
          )}

          {/* Image - SEO: Dynamic Alt tags used correctly */}
          <img
            src={course.thumbnail?.url || "/placeholder-course.jpg"}
            alt={`${course.title} - Online Course`}
            onLoad={() => setIsImageLoaded(true)}
            loading="lazy"
            className={`
      w-full h-full object-cover transition-all duration-700 ease-out
      ${isHovered ? "scale-105 sm:scale-110" : "scale-100"}
      ${isImageLoaded ? "opacity-100" : "opacity-0"}
    `}
          />

          {/* Overlay Gradient - SEO: pointer-events-none ensures it doesn't block interactions */}
          <div
            className={`
    absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/10 to-transparent
    transition-opacity duration-500 pointer-events-none
    ${isHovered ? "opacity-100" : "opacity-60"}
  `}
          />

          {/* Wishlist Button - Scaled for 320px mobile tap targets */}
          <div
            className={`
    absolute top-2 right-2 sm:top-3 sm:right-3 transition-all duration-300 z-20
    ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 sm:opacity-0"}
  `}
          >
            <div className="bg-white/95 backdrop-blur-sm p-1.5 sm:p-2.5 rounded-full shadow-lg hover:bg-rose-50 transition-all duration-300 group/wishlist hover:scale-110 active:scale-90">
              <WishlistButton
                itemType="course"
                itemId={course._id}
                name={course.title}
                price={course.discountPrice || course.price}
                image={course.thumbnail?.url}
                slug={course.slug}
                description={course.description}
                iconClassName="group-hover/wishlist:text-rose-500 transition-colors w-4 h-4 sm:w-5 sm:h-5"
              />
            </div>
          </div>

          {/* Play Overlay - Responsive sizing (smaller on mobile) */}
          <div
            className={`
    absolute inset-0 flex items-center justify-center transition-all duration-500 pointer-events-none
    ${isHovered ? "opacity-100" : "opacity-0"}
  `}
          >
            <div
              className={`
      w-12 h-12 sm:w-16 sm:h-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl
      transform transition-all duration-500
      ${isHovered ? "scale-100" : "scale-50"}
    `}
            >
              <Play className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600 ml-0.5 sm:ml-1 fill-current" />
            </div>
          </div>

          {/* Duration Badge - Optimized for small screens */}
          {course.duration > 0 && (
            <div
              className={`
      absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/70 backdrop-blur-sm text-white 
      text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg flex items-center
      transition-all duration-300 border border-white/10
      ${isHovered ? "translate-y-0 opacity-100" : "translate-y-0 opacity-90"}
    `}
            >
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </div>
          )}

          {/* Status Badges (Enrolled/Discount) - Left aligned, scaled down */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5">
            {isCourseEnrolled ? (
              <div className="bg-green-600 text-white text-[10px] sm:text-xs font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg flex items-center border border-green-500">
                <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                এনরোল্ড
              </div>
            ) : (
              discountPercentage > 0 && (
                <div
                  className={`
        bg-gradient-to-r from-orange-500 to-amber-500 
        text-white text-[10px] sm:text-xs font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg
        transform transition-all duration-300
        ${isHovered ? "scale-105" : "scale-100"}
      `}
                >
                  <span className="flex items-center">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 fill-current" />
                    -{discountPercentage}%
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-5">
        {/* Badges Row - Tightened for 320px */}
        <div
          className="flex items-center flex-wrap gap-1.5 mb-2"
          aria-label="Course metadata"
        >
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center transition-all ${getLevelColor(course.level)}`}
          >
            {getLevelIcon(course.level)}
            <span className="ml-1 uppercase tracking-tight">
              {course.level}
            </span>
          </span>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-50 text-neutral-500 border border-neutral-100">
            {course.courseLanguage || course.language || "বাংলা"}
          </span>

          {course.isBestseller && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              বেস্টসেলার
            </span>
          )}
        </div>

        {/* Title - SEO Friendly H3 with better spacing */}
        <Link to={`/course/${course.slug}`} title={course.title}>
          <h3 className="font-bold text-[14px] sm:text-base text-neutral-800 line-clamp-2 hover:text-purple-600 transition-colors duration-300 font-bangla leading-snug min-h-[2.5rem] mb-1.5">
            {course.title}
          </h3>
        </Link>

        {/* Instructor - Minimalist */}
        <div className="flex items-center mb-3">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mr-1.5 flex-shrink-0">
            <span className="text-[10px] font-black text-purple-600">
              {course.instructor?.name?.charAt(0) || "I"}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 font-bold truncate">
            {course.instructor?.name}
          </p>
        </div>

        {/* Stats Grid - Fixed Overlap for small screens */}
        <div className="grid grid-cols-3 gap-1 py-2 border-y border-neutral-50">
          <div className="flex flex-col items-center sm:flex-row sm:justify-center group/stat">
            <Users className="w-3.5 h-3.5 text-neutral-400 group-hover/stat:text-purple-500" />
            <span className="text-[11px] font-black text-neutral-700 sm:ml-1">
              {course.enrolledStudents?.length || 0}
            </span>
          </div>

          <div className="flex flex-col items-center sm:flex-row sm:justify-center border-x border-neutral-50 group/stat">
            <BookOpen className="w-3.5 h-3.5 text-neutral-400 group-hover/stat:text-blue-500" />
            <span className="text-[11px] font-black text-neutral-700 sm:ml-1">
              {course.lessons?.length || 0}
            </span>
          </div>

          <div className="flex flex-col items-center sm:flex-row sm:justify-center group/stat">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-black text-neutral-700 sm:ml-1">
              {course.averageRating || 0}
            </span>
          </div>
        </div>

        {/* Progress Bar - Only visible if enrolled */}
        {isCourseEnrolled && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 font-bold font-bangla">
                প্রোগ্রেস
              </span>
              <span className="font-black text-purple-600">
                {courseProgress}%
              </span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${courseProgress === 100 ? "bg-green-500" : "bg-purple-600"}`}
                style={{ width: `${courseProgress}%` }}
              />
            </div>
            <Link
              to={`/course/${course.slug}/learn`}
              className="mt-2 block w-full text-center py-2.5 rounded-lg bg-purple-600 text-white text-[12px] font-bold hover:bg-purple-700 transition-all shadow-md active:scale-95 font-bangla"
            >
              চালিয়ে যান
            </Link>
          </div>
        )}

        {/* Price & CTA - Ultra Compact */}
        {!isCourseEnrolled && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-col">
              {course.discountPrice ? (
                <>
                  <span className="text-[16px] sm:text-xl font-black text-purple-600 leading-none font-bangla">
                    {formatPrice(course.discountPrice)}
                  </span>
                  <span className="text-[11px] text-neutral-400 line-through leading-none mt-1">
                    {formatPrice(course.price)}
                  </span>
                </>
              ) : (
                <span className="text-[16px] sm:text-xl font-black text-purple-600 font-bangla leading-none">
                  {formatPrice(course.price)}
                </span>
              )}
            </div>

            <Link
              to={`/course/${course.slug}`}
              className="px-4 py-2 rounded-lg text-[12px] font-bold bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-600 hover:text-white transition-all active:scale-90 font-bangla"
            >
              দেখুন
            </Link>
          </div>
        )}
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
};

export default CourseCard;
