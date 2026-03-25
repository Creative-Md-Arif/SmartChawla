import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async thunks
export const fetchBanners = createAsyncThunk(
  'banner/fetchBanners',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/banners', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch banners');
    }
  }
);

export const fetchActiveBanners = createAsyncThunk(
  'banner/fetchActiveBanners',
  async (position, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/banners/active', { params: { position } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active banners');
    }
  }
);

const initialState = {
  banners: [],
  activeBanners: [],
  loading: false,
  error: null,
};

const bannerSlice = createSlice({
  name: 'banner',
  initialState,
  reducers: {
    setBanners: (state, action) => {
      state.banners = action.payload;
    },
    addBanner: (state, action) => {
      state.banners.push(action.payload);
    },
    updateBanner: (state, action) => {
      const index = state.banners.findIndex((b) => b._id === action.payload._id);
      if (index >= 0) {
        state.banners[index] = action.payload;
      }
    },
    deleteBanner: (state, action) => {
      state.banners = state.banners.filter((b) => b._id !== action.payload);
    },
    setActiveBanners: (state, action) => {
      state.activeBanners = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload.banners;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchActiveBanners.fulfilled, (state, action) => {
        state.activeBanners = action.payload.banners;
      });
  },
});

export const { setBanners, addBanner, updateBanner, deleteBanner, setActiveBanners } =
  bannerSlice.actions;

// Selectors
export const selectBannersByPosition = (state, position) =>
  state.banner.activeBanners.filter((b) => b.position === position);

export default bannerSlice.reducer;
