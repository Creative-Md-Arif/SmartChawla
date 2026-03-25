import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageLoader } from '../components/common/Loader';

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // এখানে superadmin সরিয়ে শুধু admin রাখা হয়েছে
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;