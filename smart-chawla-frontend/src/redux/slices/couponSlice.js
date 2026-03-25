import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// Async thunks
export const fetchCoupons = createAsyncThunk(
  "coupon/fetchCoupons",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/coupons", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch coupons",
      );
    }
  },
);

export const validateCoupon = createAsyncThunk(
  "coupon/validateCoupon",
  async ({ code, subtotal, items }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/coupons/validate", {
        params: {
          code,
          subtotal,
          items: items ? JSON.stringify(items) : undefined,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to validate coupon",
      );
    }
  },
);

export const applyCouponCode = createAsyncThunk(
  "coupon/applyCouponCode",
  async ({ code, subtotal, items }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/coupons/apply", {
        code,
        subtotal,
        items,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply coupon",
      );
    }
  },
);

export const getMyCoupons = createAsyncThunk(
  "coupon/getMyCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/coupons/my-coupons");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my coupons",
      );
    }
  },
);

const initialState = {
  coupons: [],
  availableCoupons: [],
  usedCoupons: [],
  appliedCoupon: null,
  discountAmount: 0,
  loading: false,
  error: null,
  validationError: null,
};

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    setCoupons: (state, action) => {
      state.coupons = action.payload;
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
      state.discountAmount = action.payload.discount || 0;
      state.validationError = null;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
      state.validationError = null;
    },
    setDiscount: (state, action) => {
      state.discountAmount = action.payload;
    },
    clearValidationError: (state) => {
      state.validationError = null;
    },
    resetCouponState: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
      state.validationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.coupons;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate coupon
      .addCase(validateCoupon.pending, (state) => {
        state.loading = true;
        state.validationError = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.valid) {
          state.validationError = action.payload.reason;
        }
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.validationError = action.payload;
      })

      // Apply coupon
      .addCase(applyCouponCode.pending, (state) => {
        state.loading = true;
        state.validationError = null;
      })
      .addCase(applyCouponCode.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.valid) {
          state.appliedCoupon = {
            code: action.payload.couponCode,
            discountType: action.payload.discountType,
            discountValue: action.payload.discountValue,
          };
          state.discountAmount = action.payload.discount;
          state.validationError = null;
        } else {
          state.validationError = action.payload.reason;
          state.appliedCoupon = null;
          state.discountAmount = 0;
        }
      })
      .addCase(applyCouponCode.rejected, (state, action) => {
        state.loading = false;
        state.validationError = action.payload;
        state.appliedCoupon = null;
        state.discountAmount = 0;
      })

      // Get my coupons
      .addCase(getMyCoupons.fulfilled, (state, action) => {
        state.availableCoupons = action.payload.availableCoupons || [];
        state.usedCoupons = action.payload.usedCoupons || [];
      });
  },
});

export const {
  setCoupons,
  applyCoupon,
  removeCoupon,
  setDiscount,
  clearValidationError,
  resetCouponState,
} = couponSlice.actions;

export default couponSlice.reducer;
