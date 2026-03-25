import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CourseCard from '../../components/cards/CourseCard';
import axiosInstance from '../../utils/axiosInstance';
import { CourseCardSkeleton } from '../../components/common/Loader';
import { selectEnrolledCourses } from "../../redux/slices/enrollSlice";

const CourseList = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });

  // ✅ Redux থেকে enrolled courses নিন
  const enrolledCourses = useSelector(selectEnrolledCourses);
  const enrolledIds = enrolledCourses.map((c) => c.courseId);

  useEffect(() => {
    fetchCourses();
  }, [searchParams, filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const searchQuery = searchParams.get('search');
      if (searchQuery) params.search = searchQuery;

      const response = await axiosInstance.get('/courses', { params });
      
      // ✅ Enrolled status যোগ করুন
      const coursesWithEnrollment = (response.data.courses || []).map(
        (course) => ({
          ...course,
          isEnrolled: enrolledIds.includes(course._id),
        })
      );
      
      setCourses(coursesWithEnrollment);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <select
            value={filters.level}
            onChange={(e) =>
              setFilters({ ...filters, level: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          >
            <option value="">All Levels</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters({ ...filters, sort: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
          >
            <option value="-createdAt">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-enrolledStudents">Most Popular</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              enrolled={course.isEnrolled}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;