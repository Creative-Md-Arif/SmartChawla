import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActiveBanners } from '../redux/slices/bannerSlice';

export const useBanners = (position = null) => {
  const dispatch = useDispatch();
  const { activeBanners, loading, error } = useSelector((state) => state.banner);

  useEffect(() => {
    dispatch(fetchActiveBanners(position));
  }, [dispatch, position]);

  const banners = position
    ? activeBanners.filter((b) => b.position === position)
    : activeBanners;

  return {
    banners,
    loading,
    error,
  };
};

export default useBanners;
