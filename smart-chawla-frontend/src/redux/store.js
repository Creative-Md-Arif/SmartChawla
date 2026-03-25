import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import categoryReducer from './slices/categorySlice';
import bannerReducer from './slices/bannerSlice';
import couponReducer from './slices/couponSlice';
import wishlistReducer from "./slices/wishlistSlice";
import enrollReducer from "./slices/enrollSlice";

export const store = configureStore({
  
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    category: categoryReducer,
    banner: bannerReducer,
    coupon: couponReducer,
    wishlist: wishlistReducer,
    enrollments: enrollReducer,
    
  },
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/setUser", 'enrollments/enrollCourse'],
      },
    }),
});

export default store;
