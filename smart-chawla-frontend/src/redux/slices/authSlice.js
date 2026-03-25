import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// ==================== ASYNC THUNKS ====================

// Login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

// Register
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

// Fetch Profile
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/me");
      // FIXED: Save to localStorage when fetching profile
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile",
      );
    }
  },
);

// Update Profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        "/auth/update-profile",
        userData,
      );
      // FIXED: Update localStorage with new user data
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile",
      );
    }
  },
);

// ==================== ADDED: Address Thunks ====================

// Add Address
export const addAddress = createAsyncThunk(
  "auth/addAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/addresses", addressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add address",
      );
    }
  },
);

// Update Address
export const updateAddress = createAsyncThunk(
  "auth/updateAddress",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/auth/addresses/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update address",
      );
    }
  },
);

// Delete Address
export const deleteAddress = createAsyncThunk(
  "auth/deleteAddress",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/auth/addresses/${id}`);
      return { id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete address",
      );
    }
  },
);

// Resend Verification
export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/resend-verification");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send verification",
      );
    }
  },
);

// ==================== SLICE ====================

const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // FIXED: setUser now saves to localStorage too
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      // CRITICAL: Save to localStorage so data persists after refresh
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },

    clearError: (state) => {
      state.error = null;
    },

    // ADDED: Manual address update reducer for optimistic updates
    updateUserAddresses: (state, action) => {
      if (state.user) {
        state.user.addresses = action.payload;
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ========== LOGIN ==========
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // ========== REGISTER ==========
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== FETCH PROFILE ==========
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data;
        state.isAuthenticated = true;
        // FIXED: localStorage updated in thunk
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })

      // ========== UPDATE PROFILE ==========
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data;
        // FIXED: localStorage updated in thunk
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== ADD ADDRESS ==========
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          const newAddress = action.payload.address;
          state.user.addresses = [...(state.user.addresses || []), newAddress];
          // CRITICAL: Save updated user to localStorage
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== UPDATE ADDRESS ==========
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          const updatedAddress = action.payload.address;
          state.user.addresses = state.user.addresses.map((addr) =>
            addr._id === updatedAddress._id ? updatedAddress : addr,
          );
          // CRITICAL: Save updated user to localStorage
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== DELETE ADDRESS ==========
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.addresses = state.user.addresses.filter(
            (addr) => addr._id !== action.payload.id,
          );
          // CRITICAL: Save updated user to localStorage
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, logout, clearError, updateUserAddresses } =
  authSlice.actions;
export default authSlice.reducer;
