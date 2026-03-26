// redux/slices/wishlistSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Load from localStorage
const loadWishlistFromStorage = () => {
  try {
    const saved = localStorage.getItem("smart_chawla_wishlist");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading wishlist:", error);
  }
  return { items: [], itemCount: 0 };
};

// Save to localStorage
const saveToStorage = (state) => {
  try {
    localStorage.setItem(
      "smart_chawla_wishlist",
      JSON.stringify({
        items: state.items,
        itemCount: state.itemCount,
      }),
    );
  } catch (error) {
    console.error("Error saving wishlist:", error);
  }
};

const initialState = loadWishlistFromStorage();

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    // Add item to wishlist
    addToWishlist: (state, action) => {
      const { itemType, itemId, name, price, image, slug, description, _id } =
        action.payload;

      // Use _id or itemId (handle both formats)
      const id = itemId || _id;

      const exists = state.items.find(
        (item) =>
          (item.itemId === id || item._id === id) && item.itemType === itemType,
      );

      if (!exists) {
        state.items.push({
          itemType,
          itemId: id,
          _id: id,
          name,
          price,
          image,
          slug,
          description: description || "",
          addedAt: new Date().toISOString(),
        });
        state.itemCount = state.items.length;
        saveToStorage(state);
      }
    },

    // Remove from wishlist
    removeFromWishlist: (state, action) => {
      const { itemId, _id, itemType } = action.payload;
      const id = itemId || _id;

      state.items = state.items.filter(
        (item) =>
          !(
            (item.itemId === id || item._id === id) &&
            item.itemType === itemType
          ),
      );
      state.itemCount = state.items.length;
      saveToStorage(state);
    },

    // Toggle wishlist (add if not exists, remove if exists)
    toggleWishlist: (state, action) => {
      const { itemType, itemId, _id, name, price, image, slug, description } =
        action.payload;
      const id = itemId || _id;

      const index = state.items.findIndex(
        (item) =>
          (item.itemId === id || item._id === id) && item.itemType === itemType,
      );

      if (index >= 0) {
        // Remove
        state.items.splice(index, 1);
      } else {
        // Add
        state.items.push({
          itemType,
          itemId: id,
          _id: id,
          name,
          price,
          image,
          slug,
          description: description || "",
          addedAt: new Date().toISOString(),
        });
      }

      state.itemCount = state.items.length;
      saveToStorage(state);
    },

    // Clear entire wishlist
    clearWishlist: (state) => {
      state.items = [];
      state.itemCount = 0;
      saveToStorage(state);
    },

    // Move item to cart (remove from wishlist)
    moveToCart: (state, action) => {
      const { itemId, _id, itemType } = action.payload;
      const id = itemId || _id;

      state.items = state.items.filter(
        (item) =>
          !(
            (item.itemId === id || item._id === id) &&
            item.itemType === itemType
          ),
      );
      state.itemCount = state.items.length;
      saveToStorage(state);
    },

    // Import wishlist (for bulk operations)
    setWishlist: (state, action) => {
      const items = action.payload.items || action.payload || [];
      state.items = items;
      state.itemCount = items.length;
      saveToStorage(state);
    },

    // Merge with another wishlist (avoid duplicates)
    mergeWishlist: (state, action) => {
      const newItems = action.payload.items || [];

      newItems.forEach((newItem) => {
        const id = newItem.itemId || newItem._id;
        const exists = state.items.find(
          (item) =>
            (item.itemId === id || item._id === id) &&
            item.itemType === newItem.itemType,
        );

        if (!exists) {
          state.items.push({
            ...newItem,
            itemId: id,
            _id: id,
            addedAt: newItem.addedAt || new Date().toISOString(),
          });
        }
      });

      state.itemCount = state.items.length;
      saveToStorage(state);
    },
  },
});

// Selectors
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.itemCount;
export const selectIsInWishlist = (itemType, itemId) => (state) => {
  return state.wishlist.items.some(
    (item) =>
      (item.itemId === itemId || item._id === itemId) &&
      item.itemType === itemType,
  );
};

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
  moveToCart,
  setWishlist,
  mergeWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
