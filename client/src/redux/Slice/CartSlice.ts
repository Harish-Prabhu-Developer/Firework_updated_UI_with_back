import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Persistent storage helper
const getInitialCart = (): Record<string, number> => {
  return {};
};

interface CartState {
  quantities: Record<string, number>;
}

const initialState: CartState = {
  quantities: getInitialCart(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setQuantity: (state, action: PayloadAction<{ id: string; num: number }>) => {
      state.quantities[action.payload.id] = action.payload.num;
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; delta: number }>) => {
      const { id, delta } = action.payload;
      const current = state.quantities[id] || 0;
      state.quantities[id] = Math.max(0, current + delta);
    },
    clearCart: (state) => {
      state.quantities = {};
    },
  },
});

export const { setQuantity, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
