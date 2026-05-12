import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '../../types/product';

interface ProductState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  categories: [],
  isLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  },
  extraReducers: () => {},
});

export const { setCategories, setLoading, setError } = productSlice.actions;
export default productSlice.reducer;
