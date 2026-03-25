import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  Heart,
  Zap,
  Award,
  TrendingUp
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { formatPrice } from '../../utils/formatters';
import WishlistButton from '../common/WishlistButton';
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
    selectIsEnrolled(state, course._id)
  );
  const reduxProgress = useSelector((state) =>
    selectCourseProgress(state, course._id)
  );

  // Combine props and Redux data
  const isCourseEnrolled = enrolled || isEnrolledRedux;
  const courseProgress = progress || reduxProgress;

  const discountPercentage = course.discountPrice
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
    : 0;

  const getLevelColor = (level) => {
    const colors = {
      Beginner: 'bg-secondary-50 text-secondary-600 border-secondary-200',
      Intermediate: 'bg-accent/10 text-amber-600 border-amber-200',
      Advanced: 'bg-rose-50 text-rose-600 border-rose-200',
      'All Levels': 'bg-primary-50 text-primary-600 border-primary-200',
    };
    return colors[level] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
  };

  const getLevelIcon = (level) => {
    const icons = {
      Beginner: <TrendingUp className="w-3 h-3 mr-1" />,
      Intermediate: <Zap className="w-3 h-3 mr-1" />,
      Advanced: <Award className="w-3 h-3 mr-1" />,
      'All Levels': <Star className="w-3 h-3 mr-1" />,
    };
    return icons[level] || null;
  };

  return (
    <div
      className={`
        group relative bg-white rounded-2xl shadow-soft border border-neutral-100 
        overflow-hidden transition-all duration-500 ease-out
        hover:shadow-premium hover:border-primary-200 hover:-translate-y-1
        ${isCourseEnrolled ? 'ring-2 ring-primary-100' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <Link to={`/course/${course.slug}`} className="relative block overflow-hidden">
        <div className="aspect-video overflow-hidden bg-neutral-50 relative">
          {/* Skeleton Loader */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-neutral-100 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                   style={{ backgroundSize: '200% 100%' }} />
            </div>
          )}
          
          <img
            src={course.thumbnail?.url || '/placeholder-course.jpg'}
            alt={course.title}
            onLoad={() => setIsImageLoaded(true)}
            className={`
              w-full h-full object-cover transition-all duration-700 ease-out
              ${isHovered ? 'scale-110' : 'scale-100'}
              ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />

          {/* Overlay Gradient */}
          <div className={`
            absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent
            transition-opacity duration-500
            ${isHovered ? 'opacity-100' : 'opacity-60'}
          `} />

          {/* Wishlist Button */}
          <div className={`
            absolute top-3 right-3 transition-all duration-300
            ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `}>
            <div className="bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-rose-50 transition-all duration-300 group/wishlist hover:scale-110">
              <WishlistButton
                itemType="course"
                itemId={course._id}
                name={course.title}
                price={course.discountPrice || course.price}
                image={course.thumbnail?.url}
                slug={course.slug}
                description={course.description}
                iconClassName="group-hover/wishlist:text-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Play Overlay */}
          <div className={`
            absolute inset-0 flex items-center justify-center transition-all duration-500
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            <div className={`
              w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl
              transform transition-all duration-500
              ${isHovered ? 'scale-100' : 'scale-50'}
              group-hover:shadow-glow
            `}>
              <Play className="w-7 h-7 text-primary-600 ml-1" />
            </div>
          </div>

          {/* Duration Badge */}
          {course.duration > 0 && (
            <div className={`
              absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white 
              text-xs font-medium px-3 py-1.5 rounded-full flex items-center
              transition-all duration-300
              ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}
            `}>
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {Math.floor(course.duration / 60)}h {course.duration % 60}m
            </div>
          )}

          {/* Discount Badge */}
          {discountPercentage > 0 && !isCourseEnrolled && (
            <div className={`
              absolute top-3 left-3 bg-gradient-to-r from-accent to-amber-500 
              text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg
              transform transition-all duration-300
              ${isHovered ? 'scale-105' : 'scale-100'}
            `}>
              <span className="flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                -{discountPercentage}%
              </span>
            </div>
          )}

          {/* Enrolled Badge */}
          {isCourseEnrolled && (
            <div className="absolute top-3 left-3 bg-secondary-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center">
              <Award className="w-3.5 h-3.5 mr-1.5" />
              এনরোল্ড
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Badges Row */}
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <span className={`
            text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center
            transition-all duration-300
            ${getLevelColor(course.level)}
          `}>
            {getLevelIcon(course.level)}
            {course.level}
          </span>
          
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
            {course.courseLanguage || course.language || 'বাংলা'}
          </span>

          {course.isBestseller && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              বেস্টসেলার
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/course/${course.slug}`}>
          <h3 className="font-semibold text-neutral-800 line-clamp-2 hover:text-primary-600 transition-colors duration-300 font-bangla leading-relaxed min-h-[3.5rem]">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        <div className="flex items-center mt-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
            <span className="text-xs font-bold text-primary-600">
              {course.instructor?.name?.charAt(0) || 'I'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 font-medium truncate">
            {course.instructor?.name}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 py-3 border-y border-neutral-100">
          <div className="flex items-center text-sm text-neutral-600 group/stat">
            <div className="p-1.5 bg-primary-50 rounded-lg mr-2 group-hover/stat:bg-primary-100 transition-colors">
              <Users className="w-4 h-4 text-primary-500" />
            </div>
            <span className="font-medium">{course.enrolledStudents?.length || 0}</span>
            <span className="text-neutral-400 ml-1 text-xs">স্টুডেন্ট</span>
          </div>
          
          <div className="flex items-center text-sm text-neutral-600 group/stat">
            <div className="p-1.5 bg-secondary-50 rounded-lg mr-2 group-hover/stat:bg-secondary-100 transition-colors">
              <BookOpen className="w-4 h-4 text-secondary-500" />
            </div>
            <span className="font-medium">{course.lessons?.length || 0}</span>
            <span className="text-neutral-400 ml-1 text-xs">লেসন</span>
          </div>
          
          <div className="flex items-center text-sm text-neutral-600 group/stat">
            <div className="p-1.5 bg-amber-50 rounded-lg mr-2 group-hover/stat:bg-amber-100 transition-colors">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <span className="font-medium">{course.averageRating || 0}</span>
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {isCourseEnrolled && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 font-medium font-bangla">প্রোগ্রেস</span>
              <span className="font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                {courseProgress}%
              </span>
            </div>
            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`
                  h-full rounded-full transition-all duration-1000 ease-out relative
                  ${courseProgress === 100 
                    ? 'bg-gradient-to-r from-secondary-400 to-secondary-500' 
                    : 'bg-gradient-to-r from-primary-400 to-primary-600'
                  }
                `}
                style={{ width: `${courseProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
            <Link
              to={`/course/${course.slug}/learn`}
              className={`
                mt-3 block w-full text-center py-3 rounded-xl font-medium transition-all duration-300
                ${courseProgress > 0 
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-glow' 
                  : 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-lg hover:shadow-glow'
                }
              `}
            >
              <span className="flex items-center justify-center font-bangla">
                {courseProgress > 0 ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    লার্নিং চালিয়ে যান
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    শেখা শুরু করুন
                  </>
                )}
              </span>
            </Link>
          </div>
        )}

        {/* Price & CTA (if not enrolled) */}
        {!isCourseEnrolled && (
          <div className="flex items-center justify-between mt-5">
            <div className="flex items-baseline">
              {course.discountPrice ? (
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-primary-600 font-bangla">
                    {formatPrice(course.discountPrice)}
                  </span>
                  <span className="text-sm text-neutral-400 line-through">
                    {formatPrice(course.price)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-primary-600 font-bangla">
                  {formatPrice(course.price)}
                </span>
              )}
            </div>
            
            <Link
              to={`/course/${course.slug}`}
              className={`
                px-5 py-2.5 rounded-xl font-medium transition-all duration-300
                bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white
                border border-primary-200 hover:border-primary-500 hover:shadow-glow
                flex items-center group/btn
              `}
            >
              <span className="font-bangla">দেখুন</span>
              <Play className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className={`
        absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary-200 ring-offset-2" />
      </div>
    </div>
  );
};

export default CourseCard;