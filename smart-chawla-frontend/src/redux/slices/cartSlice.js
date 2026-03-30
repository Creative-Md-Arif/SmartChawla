import { createSlice } from "@reduxjs/toolkit";

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      // 🔧 FIX: Ensure items is always an array
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        totalAmount: parsed.totalAmount || 0,
        itemCount: parsed.itemCount || 0,
      };
    }
  } catch (error) {
    console.error("Error loading cart:", error);
  }
  // 🔧 FIX: Always return valid initial state
  return { items: [], totalAmount: 0, itemCount: 0 };
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    // 🔧 FIX: Ensure we're saving valid data
    const dataToSave = {
      items: Array.isArray(cart.items) ? cart.items : [],
      totalAmount: cart.totalAmount || 0,
      itemCount: cart.itemCount || 0,
    };
    localStorage.setItem("cart", JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Error saving cart:", error);
  }
};

// Calculate totals
const calculateTotals = (items) => {
  // 🔧 FIX: Ensure items is array
  if (!Array.isArray(items)) {
    return { totalAmount: 0, itemCount: 0 };
  }
  return items.reduce(
    (acc, item) => ({
      totalAmount: acc.totalAmount + (item.price || 0) * (item.quantity || 1),
      itemCount: acc.itemCount + (item.quantity || 1),
    }),
    { totalAmount: 0, itemCount: 0 },
  );
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      if (!Array.isArray(state.items)) {
        state.items = [];
      }
      const {
        itemType,
        itemId,
        name,
        price,
        discountPrice, // ✅ যোগ করুন
        image,
        instructor, // ✅ যোগ করুন
        duration, // ✅ যোগ করুন
        level, // ✅ যোগ করুন
        quantity = 1,
      } = action.payload;

      // Same itemType + itemId + price (price change হলে নতুন item)
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.itemId === itemId &&
          item.itemType === itemType &&
          item.price === price,
      );

      if (existingItemIndex >= 0) {
        // Existing item - quantity বাড়াও
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // New item - নতুন entry
        state.items.push({
          itemType,
          itemId,
          name,
          price,
          discountPrice, // ✅
          image,
          instructor, // ✅
          duration, // ✅
          level, // ✅
          quantity,
          addedAt: new Date().toISOString(),
        });
      }

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },

    // Same item, different price - merge না করে replace
    addToCartReplace: (state, action) => {
      const {
        itemType,
        itemId,
        name,
        price,
        image,
        quantity = 1,
      } = action.payload;

      // Remove existing same item (any price)
      state.items = state.items.filter(
        (item) => !(item.itemId === itemId && item.itemType === itemType),
      );

      // Add new with updated price
      state.items.push({
        itemType,
        itemId,
        name,
        price,
        image,
        quantity,
        addedAt: new Date().toISOString(),
      });

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },

    removeFromCart: (state, action) => {
      const { itemId, itemType } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.itemId === itemId && item.itemType === itemType),
      );

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },

    updateQuantity: (state, action) => {
      const { itemId, itemType, quantity } = action.payload;

      const itemIndex = state.items.findIndex(
        (item) => item.itemId === itemId && item.itemType === itemType,
      );

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
      }

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },

    // Quantity বাড়াও (increment)
    increaseQuantity: (state, action) => {
      const { itemId, itemType } = action.payload;

      const itemIndex = state.items.findIndex(
        (item) => item.itemId === itemId && item.itemType === itemType,
      );

      if (itemIndex >= 0) {
        state.items[itemIndex].quantity += 1;
      }

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },

    // Quantity কমাও (decrement)
    decreaseQuantity: (state, action) => {
      const { itemId, itemType } = action.payload;

      const itemIndex = state.items.findIndex(
        (item) => item.itemId === itemId && item.itemType === itemType,
      );

      if (itemIndex >= 0) {
        if (state.items[itemIndex].quantity > 1) {
          state.items[itemIndex].quantity -= 1;
        } else {
          state.items.splice(itemIndex, 1);
        }
      }

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.itemCount = 0;
      saveCartToStorage(state);
    },

    setCart: (state, action) => {
      state.items = action.payload.items || [];
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;
      saveCartToStorage(state);
    },

    moveToSaved: (state, action) => {
      const { itemId, itemType } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.itemId === itemId && item.itemType === itemType),
      );

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.itemCount = totals.itemCount;

      saveCartToStorage(state);
    },
  },
});

export const {
  addToCart,
  addToCartReplace,
  removeFromCart,
  updateQuantity,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  setCart,
  moveToSaved,
} = cartSlice.actions;

export default cartSlice.reducer;
