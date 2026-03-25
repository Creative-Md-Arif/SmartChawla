import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// ==================== FETCH THUNKS ====================
export const fetchCategories = createAsyncThunk(
  "category/fetchCategories",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/categories", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
);

export const fetchCategoryTree = createAsyncThunk(
  "category/fetchCategoryTree",
  async (type = null, { rejectWithValue }) => {
    try {
      const params = type ? { type } : {};
      const response = await axiosInstance.get("/categories/tree", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch category tree",
      );
    }
  },
);

// ==================== CRUD THUNKS ====================
export const createCategory = createAsyncThunk(
  "category/create",
  async ({ data, isFormData = false }, { rejectWithValue }) => {
    try {
      const headers = isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" };

      const response = await axiosInstance.post("/categories", data, {
        headers,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category",
      );
    }
  },
);

export const updateCategory = createAsyncThunk(
  "category/update",
  async ({ id, data, isFormData = false }, { rejectWithValue }) => {
    try {
      const headers = isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" };

      const response = await axiosInstance.patch(`/categories/${id}`, data, {
        headers,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category",
      );
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "category/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category",
      );
    }
  },
);

export const reorderCategories = createAsyncThunk(
  "category/reorder",
  async (categories, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/categories/reorder", {
        categories,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reorder categories",
      );
    }
  },
);

// ==================== SLICE ====================
const initialState = {
  categories: [],
  treeStructure: [],
  selectedCategory: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    selectCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    clearSelection: (state) => {
      state.selectedCategory = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Category Tree
      .addCase(fetchCategoryTree.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.loading = false;
        state.treeStructure = action.payload.tree || action.payload.categories;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCategoryTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh tree to get updated structure
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Update in tree structure
        const updateInTree = (categories) => {
          return categories.map((cat) => {
            if (cat._id === action.payload.category._id) {
              return { ...cat, ...action.payload.category };
            }
            if (cat.subCategories?.length) {
              return { ...cat, subCategories: updateInTree(cat.subCategories) };
            }
            return cat;
          });
        };
        state.treeStructure = updateInTree(state.treeStructure);
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from tree structure
        const removeFromTree = (categories) => {
          return categories
            .filter((cat) => cat._id !== action.payload)
            .map((cat) => ({
              ...cat,
              subCategories: removeFromTree(cat.subCategories || []),
            }));
        };
        state.treeStructure = removeFromTree(state.treeStructure);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { selectCategory, clearSelection, clearError } =
  categorySlice.actions;

// Selectors
export const selectCategoryById = (state, categoryId) => {
  const findInTree = (categories) => {
    for (const cat of categories) {
      if (cat._id === categoryId) return cat;
      if (cat.subCategories?.length) {
        const found = findInTree(cat.subCategories);
        if (found) return found;
      }
    }
    return null;
  };
  return findInTree(state.category.treeStructure);
};

export const selectSubcategories = (state, parentId) =>
  state.category.categories.filter(
    (cat) =>
      cat.parentCategory === parentId || cat.parentCategory?._id === parentId,
  );

export const selectCategoriesByType = (state, type) =>
  state.category.categories.filter(
    (cat) => cat.type === type || cat.type === "both",
  );

export default categorySlice.reducer;
