import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Play, CheckCircle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { CourseCardSkeleton } from "../../components/common/Loader";
import {
  selectEnrolledCourses,
  syncEnrollments,
  clearEnrollments, // ✅ এটি import করুন
} from "../../redux/slices/enrollSlice";

const MyCourses = () => {
  const dispatch = useDispatch();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false); // ✅ error track করুন

  // ✅ Redux থেকে enrollments নিন
  const reduxEnrollments = useSelector(selectEnrolledCourses);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setApiError(false);

      // ১. API থেকে এনরোল্ড কোর্সের ডাটা আনা
      const response = await axiosInstance.get("/courses/my/enrolled");

      // আপনার রেসপন্স অবজেক্ট অনুযায়ী: response.data.courses হচ্ছে অ্যারে
      const apiCourses = response.data.courses || [];

      console.log("Fetched Enrollments:", apiCourses);

      // ২. যদি কোনো কোর্স না থাকে, তবে স্টেট এবং রেডক্স ক্লিয়ার করা
      if (apiCourses.length === 0) {
        setCourses([]);
        dispatch(clearEnrollments());
        setLoading(false);
        return;
      }

      // ৩. ডাটাবেসে ডাটা থাকলে তা সরাসরি সেভ করা
      // (অতিরিক্ত paymentStatus ফিল্টার বাদ দেওয়া হয়েছে যাতে ডাটা মিস না হয়)
      setCourses(apiCourses);

      // ৪. Redux Sync এর জন্য ডাটা ম্যাপিং
      const enrollmentsForRedux = apiCourses.map((item) => {
        // কিছু ক্ষেত্রে ডাটা item.course এর ভেতরে থাকে, আবার কিছু ক্ষেত্রে item এর সরাসরি ভেতরে
        const c = item.course || item;

        return {
          courseId: c._id, // ডাটাবেসের অবজেক্ট আইডি
          slug: c.slug,
          title: c.title,
          price: c.price,
          thumbnail: c.thumbnail,
          instructor: c.instructor,
          duration: c.duration,
          level: c.level,
          progress: item.progress || 0,
          lastAccessed: item.lastAccessed || new Date().toISOString(),
          completedLessons: item.completedLessons || [],
          status: item.status || "active",
        };
      });

      // ৫. রেডক্স স্টোর আপডেট করা
      dispatch(syncEnrollments(enrollmentsForRedux));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setApiError(true);
      // এরর হলে অন্তত রেডক্স থেকে আগের ডাটা দেখানোর চেষ্টা করা (Fallback)
      if (reduxEnrollments && reduxEnrollments.length > 0) {
        setCourses(reduxEnrollments.map((re) => ({ course: re, ...re })));
      } else {
        setCourses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ শুধু API data দেখান, Redux নয় (কারণ API source of truth)
  const displayCourses = courses; // ❌ Redux fallback রিমুভ করুন

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Courses</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            You haven't enrolled in any courses yet
          </p>

          {apiError && (
            <p className="text-red-500 text-sm mb-4">
              Failed to load courses. Please try again.
            </p>
          )}

          <Link
            to="/courses"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCourses.map((enrollment) => (
            <div
              key={enrollment._id || enrollment.course?._id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={
                    enrollment.course?.thumbnail?.url ||
                    "/placeholder-course.jpg"
                  }
                  alt={enrollment.course?.title}
                  loading="lazy"
                  fetchpriority="high"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Link
                    to={`/course/${enrollment.course?.slug}/learn`}
                    className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Play className="w-6 h-6 text-purple-600 ml-1" />
                  </Link>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900">
                  {enrollment.course?.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {enrollment.course?.instructor?.name}
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-purple-600">
                      {enrollment.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${enrollment.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Last accessed:{" "}
                    {enrollment.lastAccessed
                      ? new Date(enrollment.lastAccessed).toLocaleDateString()
                      : "Never"}
                  </span>
                  {enrollment.progress === 100 && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                <Link
                  to={`/course/${enrollment.course?.slug}/learn`}
                  className="mt-4 block w-full text-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {(enrollment.progress || 0) > 0
                    ? "Continue Learning"
                    : "Start Learning"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
