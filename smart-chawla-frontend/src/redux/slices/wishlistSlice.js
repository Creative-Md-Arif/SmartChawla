import { createSlice } from "@reduxjs/toolkit";

// Load wishlist from localStorage
const loadWishlistFromStorage = () => {
  try {
    const savedWishlist = localStorage.getItem("wishlist");
    return savedWishlist
      ? JSON.parse(savedWishlist)
      : { items: [], itemCount: 0 };
  } catch (error) {
    return { items: [], itemCount: 0 };
  }
};

// Save wishlist to localStorage
const saveWishlistToStorage = (wishlist) => {
  try {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  } catch (error) {
    console.error("Error saving wishlist:", error);
  }
};

const initialState = loadWishlistFromStorage();

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const { itemType, itemId, name, price, image, slug, description } =
        action.payload;

      // Check if item already exists
      const existingItem = state.items.find(
        (item) => item.itemId === itemId && item.itemType === itemType,
      );

      if (!existingItem) {
        state.items.push({
          itemType, // 'product' or 'course'
          itemId,
          name,
          price,
          image,
          slug, // For linking to detail page
          description: description || "",
          addedAt: new Date().toISOString(),
        });

        state.itemCount = state.items.length;
        saveWishlistToStorage(state);
      }
    },

    removeFromWishlist: (state, action) => {
      const { itemId, itemType } = action.payload;

      state.items = state.items.filter(
        (item) => !(item.itemId === itemId && item.itemType === itemType),
      );

      state.itemCount = state.items.length;
      saveWishlistToStorage(state);
    },

    toggleWishlist: (state, action) => {
      const { itemType, itemId, name, price, image, slug, description } =
        action.payload;

      const existingItemIndex = state.items.findIndex(
        (item) => item.itemId === itemId && item.itemType === itemType,
      );

      if (existingItemIndex >= 0) {
        // Remove if exists
        state.items.splice(existingItemIndex, 1);
      } else {
        // Add if not exists
        state.items.push({
          itemType,
          itemId,
          name,
          price,
          image,
          slug,
          description: description || "",
          addedAt: new Date().toISOString(),
        });
      }

      state.itemCount = state.items.length;
      saveWishlistToStorage(state);
    },

    isInWishlist: (state, action) => {
      const { itemId, itemType } = action.payload;
      return state.items.some(
        (item) => item.itemId === itemId && item.itemType === itemType,
      );
    },

    clearWishlist: (state) => {
      state.items = [];
      state.itemCount = 0;
      saveWishlistToStorage(state);
    },

    moveToCart: (state, action) => {
      const { itemId, itemType } = action.payload;

      // Remove from wishlist (cart slice এ add করতে হবে separately)
      state.items = state.items.filter(
        (item) => !(item.itemId === itemId && item.itemType === itemType),
      );

      state.itemCount = state.items.length;
      saveWishlistToStorage(state);
    },

    setWishlist: (state, action) => {
      state.items = action.payload.items || [];
      state.itemCount = state.items.length;
      saveWishlistToStorage(state);
    },

    // Sync with server (for logged in users)
    syncWishlist: (state, action) => {
      const serverWishlist = action.payload;
      // Merge local and server wishlist
      const mergedItems = [...state.items];

      serverWishlist.forEach((serverItem) => {
        const exists = mergedItems.some(
          (item) =>
            item.itemId === serverItem.itemId &&
            item.itemType === serverItem.itemType,
        );
        if (!exists) {
          mergedItems.push(serverItem);
        }
      });

      state.items = mergedItems;
      state.itemCount = mergedItems.length;
      saveWishlistToStorage(state);
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  isInWishlist,
  clearWishlist,
  moveToCart,
  setWishlist,
  syncWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
