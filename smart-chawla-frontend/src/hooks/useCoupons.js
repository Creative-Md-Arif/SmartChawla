import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export const useCoupons = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateCoupon = async (code, subtotal) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/coupons/validate', {
        params: { code, subtotal },
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to validate coupon');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code, subtotal, items) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/coupons/apply', {
        code,
        subtotal,
        items,
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply coupon');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserCoupons = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/coupons/my-coupons');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch coupons');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    validateCoupon,
    applyCoupon,
    getUserCoupons,
    loading,
    error,
  };
};

export default useCoupons;
