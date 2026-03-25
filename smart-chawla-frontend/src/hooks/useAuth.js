import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { fetchProfile, logout } from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfile());
    }
  }, [token, user, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    logout: handleLogout,
  };
};

export default useAuth;
