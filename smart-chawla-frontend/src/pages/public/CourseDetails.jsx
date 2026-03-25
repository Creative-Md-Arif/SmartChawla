import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import {
  Play,
  Clock,
  Users,
  Star,
  CheckCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lock,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ExternalLink,
  User,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "../../utils/formatters";
import { selectIsEnrolled, enrollCourse } from "../../redux/slices/enrollSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import toast from "react-hot-toast";

const CourseDetails = ({ preview = false }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedLessons, setExpandedLessons] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoError, setVideoError] = useState({});
  const [videoUrls, setVideoUrls] = useState({});

  const isEnrolledRedux = useSelector((state) =>
    course?._id ? selectIsEnrolled(state, course._id) : false,
  );

  const isInCart = useSelector((state) =>
    state.cart.items.some(
      (item) => item.itemId === course?._id && item.itemType === "course",
    ),
  );

  useEffect(() => {
    fetchCourseDetails();
  }, [slug]);

  useEffect(() => {
    if (course?._id && isEnrolledRedux) {
      setIsEnrolled(true);
    }
  }, [course, isEnrolledRedux]);

  // ✅ Cloudinary ID এক্সট্রাক্ট করুন
  const extractCloudinaryId = (videoId) => {
    if (!videoId) return null;
    if (videoId.startsWith("http")) return null;
    if (videoId.includes("smart-chawla")) return videoId;
    return null;
  };

  // ✅ YouTube ID এক্সট্রাক্ট করুন
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const cleanUrl = url.toString().trim().replace(/\s+/g, "");
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (let pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // ✅ Signed URL ফেচ করুন (enrolled users এর জন্য)
  const fetchSignedVideoUrl = async (lessonId) => {
    if (!course?._id || !isEnrolled) return null;

    try {
      const response = await axiosInstance.get(
        `/courses/${course._id}/lessons/${lessonId}/video`,
      );
      return response.data.videoUrl;
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      return null;
    }
  };

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const endpoint = preview
        ? `/courses/${slug}/preview`
        : `/courses/${slug}`;

      const response = await axiosInstance.get(endpoint);
      const courseData = response.data.course || response.data.preview;

      if (courseData?.lessons) {
        courseData.lessons = courseData.lessons.map((lesson, index) => {
          const youtubeId = extractYouTubeId(lesson.videoId || lesson.videoUrl);

          // ✅ সরাসরি backend থেকে আসা videoUrl ব্যবহার করুন
          let cloudinaryUrl = lesson.videoUrl; // full URL with version

          // Fallback: যদি videoUrl না থাকে
          if (!cloudinaryUrl && lesson.videoId?.includes("smart-chawla")) {
            cloudinaryUrl = `https://res.cloudinary.com/dyxejdy0e/video/upload/${lesson.videoId}.mp4`;
          }

          return {
            ...lesson,
            cloudinaryUrl,
            videoSource: cloudinaryUrl ? "cloudinary" : "none",
          };
        });
      }

      setCourse(courseData);

      if (isAuthenticated && !preview) {
        checkEnrollment(courseData);
      }
    } catch (error) {
      console.error("❌ Error fetching course:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async (courseData) => {
    try {
      const response = await axiosInstance.get("/courses/my-courses");
      const enrolled = response.data.courses.some(
        (c) =>
          c.course?._id === courseData._id || c.courseId === courseData._id,
      );
      setIsEnrolled(enrolled);

      if (enrolled) {
        dispatch(
          enrollCourse({
            courseId: courseData._id,
            title: courseData.title,
            price: courseData.price,
            discountPrice: courseData.discountPrice,
            thumbnail: courseData.thumbnail,
            instructor: courseData.instructor,
            duration: courseData.duration,
            level: courseData.level,
          }),
        );
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const handleEnrollNow = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/course/${slug}` } });
      return;
    }

    if (!course) return;

    setAddingToCart(true);

    try {
      dispatch(
        addToCart({
          itemType: "course",
          itemId: course._id,
          name: course.title,
          price: course.discountPrice || course.price,
          originalPrice: course.price,
          image: course.thumbnail?.url || "/placeholder-course.jpg",
          instructor: {
            name: course.instructor?.name || "Unknown",
            _id: course.instructor?._id,
          },
          duration: course.duration || 0,
          level: course.level || "Beginner",
          quantity: 1,
        }),
      );

      toast.success("Course added to cart!");
      navigate("/checkout");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add course to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCartOnly = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/course/${slug}` } });
      return;
    }

    dispatch(
      addToCart({
        itemType: "course",
        itemId: course._id,
        name: course.title,
        price: course.discountPrice || course.price,
        originalPrice: course.price,
        image: course.thumbnail?.url || "/placeholder-course.jpg",
        instructor: {
          name: course.instructor?.name || "Unknown",
          _id: course.instructor?._id,
        },
        duration: course.duration || 0,
        level: course.level || "Beginner",
        quantity: 1,
      }),
    );

    toast.success("Course saved to cart!");
  };

  const handleStartLearning = () => {
    if (!course?.slug) {
      toast.error("Cannot start learning - course data incomplete");
      return;
    }
    navigate(`/learn/${course.slug}`);
  };

  const toggleLesson = async (index) => {
    const isExpanding = !expandedLessons.includes(index);

    if (isExpanding) {
      setPlayingVideo(null);
      setVideoError((prev) => ({ ...prev, [index]: false }));

      // Fetch signed URL if needed
      const lesson = course?.lessons?.[index];
      if (lesson?.cloudinaryId && isEnrolled && !lesson.isPreview) {
        const signedUrl = await fetchSignedVideoUrl(lesson._id);
        if (signedUrl) {
          setVideoUrls((prev) => ({ ...prev, [index]: signedUrl }));
        }
      }
    }

    setExpandedLessons((prev) =>
      isExpanding ? [...prev, index] : prev.filter((i) => i !== index),
    );
  };

  const handlePlayVideo = (index) => {
    setVideoError((prev) => ({ ...prev, [index]: false }));
    setPlayingVideo(index);
  };

  const handleVideoError = (index) => {
    console.error(`Video ${index} failed to load`);
    setVideoError((prev) => ({ ...prev, [index]: true }));
    toast.error(
      "ভিডিও লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    );
  };

  // ✅ Updated video player with Cloudinary support
  const renderVideoPlayer = (lesson, index) => {
    const isPlaying = playingVideo === index;
    const hasError = videoError[index];
    const signedUrl = videoUrls[index];

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 bg-gray-100 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-gray-700 font-medium mb-3">
            ভিডিও লোড করতে সমস্যা
          </p>
          <p className="text-sm text-gray-500 mb-4 text-center px-4">
            ভিডিও লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।
          </p>
        </div>
      );
    }

    if (!isPlaying) {
      return (
        <div
          className="relative cursor-pointer group"
          onClick={() => handlePlayVideo(index)}
        >
          <img
            src={
              lesson.youtubeId
                ? `https://img.youtube.com/vi/${lesson.youtubeId}/maxresdefault.jpg`
                : course.thumbnail?.url || "/placeholder-course.jpg"
            }
            alt={lesson.title}
            className="w-full aspect-video object-cover"
            onError={(e) => {
              if (lesson.youtubeId) {
                e.target.src = `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`;
              }
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {Math.floor((lesson.duration || 0) / 60)}:
            {String(Math.floor((lesson.duration || 0) % 60)).padStart(2, "0")}
          </div>
        </div>
      );
    }

    // ✅ Cloudinary Video (with signed URL for enrolled users)
    if (lesson.videoSource === "cloudinary" && lesson.cloudinaryUrl) {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <video
            src={lesson.cloudinaryUrl}
            controls
            autoPlay
            playsInline
            className="w-full aspect-video"
            onError={(e) => {
              console.error("Video load error:", e.target.error);
              console.error("URL:", lesson.cloudinaryUrl);
              handleVideoError(index);
            }}
            poster={course.thumbnail?.url}
          />
        </div>
      );
    }

    // ✅ YouTube Video
    if (lesson.videoSource === "youtube" && lesson.youtubeId) {
      return (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={lesson.title}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onError={() => handleVideoError(index)}
          ></iframe>
        </div>
      );
    }

    // No video available
    return (
      <div className="py-6 text-center text-gray-500 bg-gray-100 rounded-lg">
        <p>কোন ভিডিও উপলব্ধ নয়</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course Not Found</h2>
          <p className="text-gray-600 mt-2">
            The course you're looking for doesn't exist.
          </p>
          <Link
            to="/courses"
            className="mt-4 inline-block text-purple-600 hover:underline"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }

  const discountPercentage = course.discountPrice
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-purple-600 text-xs px-2 py-1 rounded">
                  {course.level}
                </span>
                <span className="bg-gray-700 text-xs px-2 py-1 rounded">
                  {course.courseLanguage || course.language}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-gray-300 mb-6 line-clamp-3">
                {course.description}
              </p>

              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span>{course.averageRating || 0}</span>
                  <span className="text-gray-400 ml-1">
                    ({course.ratings?.length || 0} reviews)
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-1" />
                  <span>{course.enrolledStudents?.length || 0} students</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-1" />
                  <span>
                    {Math.floor((course.duration || 0) / 60)}h{" "}
                    {(course.duration || 0) % 60}m
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <img
                  src={course.instructor?.avatar || <User />}
                  alt={course.instructor?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{course.instructor?.name}</p>
                  <p className="text-sm text-gray-400">
                    {course.instructor?.bio?.substring(0, 50)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              {course.shortVideo?.url ? (
                <video
                  src={course.shortVideo.url}
                  controls
                  className="w-full aspect-video"
                  poster={course.thumbnail?.url}
                />
              ) : (
                <img
                  src={course.thumbnail?.url}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              )}

              <div className="p-6">
                {isEnrolled ? (
                  <Link
                    to={`/course/${course.slug}/learn`}
                    className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-glow flex items-center justify-center group"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    {isEnrolled > 0 ? "লার্নিং চালিয়ে যান" : "শেখা শুরু করুন"}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {course.discountPrice ? (
                          <div className="flex items-center">
                            <span className="text-3xl font-bold text-gray-900">
                              {formatPrice(course.discountPrice)}
                            </span>
                            <span className="ml-2 text-lg text-gray-400 line-through">
                              {formatPrice(course.price)}
                            </span>
                            <span className="ml-2 bg-red-100 text-red-600 text-sm px-2 py-1 rounded">
                              {discountPercentage}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="text-3xl font-bold text-gray-900">
                            {formatPrice(course.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleEnrollNow}
                      disabled={addingToCart || isInCart}
                      className={`w-full py-3 rounded-lg font-medium transition-colors mb-3 flex items-center justify-center ${
                        isInCart
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      {addingToCart ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : isInCart ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Already in Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {isAuthenticated ? "Enroll Now" : "Login to Enroll"}
                        </>
                      )}
                    </button>

                    {!isInCart && (
                      <button
                        onClick={handleAddToCartOnly}
                        disabled={addingToCart}
                        className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                      >
                        Add to Cart (Buy Later)
                      </button>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-3">
                      30-Day Money-Back Guarantee
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex space-x-8 border-b mb-6">
              {["overview", "curriculum", "instructor", "reviews"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-medium capitalize ${
                      activeTab === tab
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.whatYouWillLearn?.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {course.requirements?.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "curriculum" && (
              <div>
                <h3 className="text-xl font-bold mb-4">
                  Course Content ({course.lessons?.length || 0} lessons)
                </h3>
                <div className="space-y-2">
                  {course.lessons?.map((lesson, index) => (
                    <div
                      key={lesson._id || index}
                      className="border rounded-lg overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        onClick={() => toggleLesson(index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          {lesson.isPreview || isEnrolled ? (
                            <Play className="w-5 h-5 text-purple-600 mr-3" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400 mr-3" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-gray-900">
                              {lesson.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {Math.floor((lesson.duration || 0) / 60)}:
                              {String(
                                Math.floor((lesson.duration || 0) % 60),
                              ).padStart(2, "0")}{" "}
                              min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {lesson.isPreview && (
                            <span className="text-xs font-medium bg-purple-100 text-purple-600 px-2 py-1 rounded mr-3">
                              Preview
                            </span>
                          )}
                          {expandedLessons.includes(index) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </button>

                      {expandedLessons.includes(index) && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          {lesson.isPreview || isEnrolled ? (
                            <div className="mt-2">
                              {lesson.videoSource !== "none" ? (
                                <div className="flex flex-col space-y-4">
                                  <div className="relative w-full rounded-lg overflow-hidden shadow-lg bg-black">
                                    {renderVideoPlayer(lesson, index)}
                                  </div>

                                  {lesson.description && (
                                    <div className="bg-white p-3 rounded border text-sm text-gray-700">
                                      {lesson.description}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="py-6 text-center text-gray-500 bg-gray-100 rounded-lg">
                                  <p>কোন ভিডিও উপলব্ধ নয়</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-10 text-center bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                              <Lock className="w-10 h-10 text-gray-400 mb-3" />
                              <p className="text-gray-700 font-bold">
                                This lesson is locked
                              </p>
                              <button
                                onClick={handleEnrollNow}
                                className="mt-4 text-sm font-bold text-purple-600 underline hover:no-underline"
                              >
                                Enroll Now to Unlock
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "instructor" && (
              <div className="flex items-start space-x-4">
                <img
                  src={course.instructor?.avatar || "/placeholder-avatar.jpg"}
                  alt={course.instructor?.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold">
                    {course.instructor?.name}
                  </h3>
                  <p className="text-gray-600 mt-2">{course.instructor?.bio}</p>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {course.ratings?.map((rating, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.rating ? "fill-current" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{rating.review}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">This course includes:</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <Play className="w-5 h-5 mr-3" />
                  {course.duration || 0} hours on-demand video
                </li>
                <li className="flex items-center text-gray-600">
                  <BookOpen className="w-5 h-5 mr-3" />
                  {course.lessons?.length || 0} lessons
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Full lifetime access
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Access on mobile and TV
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Certificate of completion
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
