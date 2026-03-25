import { useEffect } from 'react'; // অবশ্যই ইমপোর্ট করতে হবে
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // useSelector যোগ করুন
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import './assets/styles/index.css';

import { syncEnrollments } from './redux/slices/enrollSlice';
import axiosInstance from './utils/axiosInstance';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchEnrollments = async () => {
        try {
          const response = await axiosInstance.get('/courses/my/enrolled');
          const enrollments = response.data.courses.map((e) => ({
            courseId: e.course?._id || e.courseId,
            title: e.course?.title,
            price: e.course?.price,
            discountPrice: e.course?.discountPrice,
            thumbnail: e.course?.thumbnail,
            instructor: e.course?.instructor,
            duration: e.course?.duration,
            level: e.course?.level,
            progress: e.progress || 0,
            lastAccessed: e.lastAccessed || new Date().toISOString(),
            completedLessons: e.completedLessons || [],
            status: e.status || 'active',
          }));
          dispatch(syncEnrollments(enrollments));
        } catch (error) {
          console.error('Error syncing enrollments:', error);
        }
      };
      fetchEnrollments();
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 pt-16">
          <AppRoutes />
        </main>
        <Footer />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;