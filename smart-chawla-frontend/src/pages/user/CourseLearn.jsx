import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';
import CoursePlayer from '../../components/video/CoursePlayer';
import { ChevronLeft, CheckCircle, PlayCircle } from 'lucide-react';
import {
  updateProgress,
  updateLastAccessed,
} from "../../redux/slices/enrollSlice";
import toast from 'react-hot-toast';

const CourseLearn = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // ✅ Redux থেকে enrollment check
  const { items: enrolledCourses } = useSelector((state) => state.enrollments);

  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [error, setError] = useState(null);

  // ✅ slug না থাকলে URL থেকে বের করার চেষ্টা
  const getSlugFromUrl = useCallback(() => {
    console.log('🔍 Debug URL:', {
      pathname: location.pathname,
      useParamsSlug: slug,
      search: location.search,
      hash: location.hash
    });
    
    // 1. useParams থেকে চেক
    if (slug && slug !== 'undefined' && slug !== '') {
      console.log('✅ Using slug from useParams:', slug);
      return slug;
    }
    
    // 2. URL থেকে বের করুন: /course/SLUG/learn
    const pathParts = location.pathname.split('/').filter(Boolean);
    console.log('🔍 Path parts:', pathParts);
    
    const courseIndex = pathParts.indexOf('course');
    if (courseIndex !== -1 && pathParts[courseIndex + 1]) {
      const extractedSlug = pathParts[courseIndex + 1];
      console.log('✅ Extracted slug from URL:', extractedSlug);
      return extractedSlug;
    }
    
    console.error('❌ No slug found in URL');
    return null;
  }, [slug, location.pathname]);

  const effectiveSlug = getSlugFromUrl();

  useEffect(() => {
    console.log('🎯 effectiveSlug:', effectiveSlug);
    
    if (!effectiveSlug) {
      console.error('No slug provided in URL');
      setError('Invalid course URL');
      toast.error('Invalid course URL');
      navigate('/courses');
      return;
    }
    
    fetchCourseForLearning();
  }, [effectiveSlug, navigate]);
  const fetchCourseForLearning = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 API Call:', `/courses/${effectiveSlug}/learn`);
      
      const response = await axiosInstance.get(`/courses/${effectiveSlug}/learn`);
      const courseData = response.data.course;
      
      if (!courseData) {
        throw new Error('Course data not found');
      }

      setCourse(courseData);

      // Redux থেকে enrollment check
      const enrolledCourse = enrolledCourses.find(
        (ec) => ec.courseId === courseData._id
      );
      
      const savedCompletedLessons = enrolledCourse?.completedLessons || [];
      setCompletedLessons(savedCompletedLessons);

      // First incomplete lesson
      const lessons = courseData.lessons || [];
      const firstIncomplete = lessons.find(
        (l) => !savedCompletedLessons.includes(l._id)
      );
      setCurrentLesson(firstIncomplete || lessons[0]);

      const serverProgress = response.data.progress || 0;
      const calculatedProgress = enrolledCourse?.progress || serverProgress;
      setProgress(calculatedProgress);

      dispatch(updateLastAccessed({ courseId: courseData._id }));
      
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      
      if (error.response?.status === 400) {
        setError('Invalid course URL');
        toast.error('Invalid course URL - Please check the link');
      } else if (error.response?.status === 404) {
        setError('Course not found');
        toast.error('Course not found');
      } else if (error.response?.status === 403) {
        setError('You are not enrolled in this course');
        toast.error('You are not enrolled in this course');
        navigate(`/course/${effectiveSlug}`);
      } else {
        setError('Failed to load course');
        toast.error('Failed to load course');
      }
    } finally {
      setLoading(false);
    }
  };

const handleLessonComplete = async (lessonId) => {
  console.log("🎯 Completing lesson:", {
    lessonId,
    lessonIdType: typeof lessonId,
    currentLessonId: currentLesson?._id,
    courseId: course?._id,
    courseIdType: typeof course?._id,
  });

  // ✅ Validation
  if (!lessonId) {
    console.error("❌ lessonId is undefined");
    toast.error("Cannot complete lesson - ID missing");
    return;
  }

  if (!course?._id) {
    console.error("❌ course._id is undefined");
    toast.error("Course data missing");
    return;
  }

  if (completedLessons.includes(lessonId)) {
    console.log("⚠️ Already completed");
    return;
  }

  const newCompleted = [...completedLessons, lessonId];
  setCompletedLessons(newCompleted);

  const newProgress =
    course.lessons?.length > 0
      ? Math.round((newCompleted.length / course.lessons.length) * 100)
      : 0;

  setProgress(newProgress);

  try {
    console.log("📡 API call:", {
      url: `/courses/${course._id}/progress`,
      body: { lessonId, progress: newProgress },
    });

    await axiosInstance.post(`/courses/${course._id}/progress`, {
      lessonId: lessonId.toString(), // ✅ String এ convert করুন
      progress: newProgress,
    });

    dispatch(
      updateProgress({
        courseId: course._id,
        progress: newProgress,
        completedLessonId: lessonId,
      }),
    );

    toast.success("Lesson completed!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);

    // Rollback
    setCompletedLessons(completedLessons);
    setProgress(progress);

    toast.error(error.response?.data?.message || "Failed to save progress");
  }
};

  const handleLessonSelect = (lesson) => {
    if (!lesson) return;
    setCurrentLesson(lesson);
    
    if (course?._id) {
      dispatch(updateLastAccessed({ courseId: course._id }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/course/${effectiveSlug}`)}
            className="flex items-center text-gray-300 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Course
          </button>
          <h1 className="font-bold truncate max-w-md">{course.title}</h1>
          <div className="w-24">
            <div className="h-2 bg-gray-700 rounded-full">
              <div
                className="h-2 bg-purple-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center mt-1">{progress}% Complete</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Video Player */}
        <div className="flex-1">
          <CoursePlayer
            videoUrl={currentLesson?.videoUrl || course.fullVideo?.url}
            lessons={course.lessons}
            currentLesson={currentLesson}
            onProgress={(time) => {
              // Throttle this log
              if (Math.floor(time) % 5 === 0) {
                console.log('Progress:', time);
              }
            }}
            onLessonComplete={() => handleLessonComplete(currentLesson?._id)}
          />

          <div className="bg-white p-6">
            <h2 className="text-xl font-bold mb-2">{currentLesson?.title}</h2>
            <p className="text-gray-600">{currentLesson?.description}</p>
          </div>
        </div>

        {/* Lesson Sidebar */}
        <div className="w-full lg:w-80 bg-white border-l h-screen overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-bold">Course Content</h3>
            <p className="text-sm text-gray-500">
              {completedLessons.length} / {course.lessons?.length || 0} completed
            </p>
          </div>

          <div className="divide-y">
            {course.lessons?.map((lesson, index) => (
              <button
                key={lesson._id}
                onClick={() => handleLessonSelect(lesson)}
                className={`w-full flex items-center p-4 hover:bg-gray-50 ${
                  currentLesson?._id === lesson._id
                    ? 'bg-purple-50 border-l-4 border-purple-600'
                    : ''
                }`}
              >
                {completedLessons.includes(lesson._id) ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <div className="flex-1 text-left">
                  <p
                    className={`font-medium ${
                      completedLessons.includes(lesson._id)
                        ? 'text-gray-500 line-through'
                        : ''
                    }`}
                  >
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.floor((lesson.duration || 0) / 60)}:
                    {String((lesson.duration || 0) % 60).padStart(2, '0')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearn;