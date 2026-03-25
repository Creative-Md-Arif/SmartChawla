import authReducer, {
  loginUser,
  registerUser,
  fetchProfile,
  updateProfile,
  setUser,
  logout,
  clearError,
} from './authSlice';

import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCart,
  moveToSaved,
} from './cartSlice';

import categoryReducer, {
  fetchCategories,
  fetchCategoryTree,
  selectCategory,
  clearSelection,
  setCategories,
  selectCategoryById,
  selectSubcategories,
} from './categorySlice';

import bannerReducer, {
  fetchBanners,
  fetchActiveBanners,
  setBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  setActiveBanners,
  selectBannersByPosition,
} from './bannerSlice';

import couponReducer, {
  fetchCoupons,
  validateCoupon,
  applyCouponCode,
  setCoupons,
  applyCoupon,
  removeCoupon,
  setDiscount,
  clearValidationError,
} from './couponSlice';

export {
  // Auth
  authReducer,
  loginUser,
  registerUser,
  fetchProfile,
  updateProfile,
  setUser,
  logout,
  clearError,

  // Cart
  cartReducer,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCart,
  moveToSaved,

  // Category
  categoryReducer,
  fetchCategories,
  fetchCategoryTree,
  selectCategory,
  clearSelection,
  setCategories,
  selectCategoryById,
  selectSubcategories,

  // Banner
  bannerReducer,
  fetchBanners,
  fetchActiveBanners,
  setBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  setActiveBanners,
  selectBannersByPosition,

  // Coupon
  couponReducer,
  fetchCoupons,
  validateCoupon,
  applyCouponCode,
  setCoupons,
  applyCoupon,
  removeCoupon,
  setDiscount,
  clearValidationError,
};
