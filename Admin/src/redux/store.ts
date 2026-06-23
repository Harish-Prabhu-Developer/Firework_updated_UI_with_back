import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

const makeUISlice = (name: string) =>
  createSlice({
    name,
    initialState: { search: '', selectedIds: [] as string[] },
    reducers: {
      setSearch: (state, action: PayloadAction<string>) => { state.search = action.payload; },
      setSelectedIds: (state, action: PayloadAction<string[]>) => { state.selectedIds = action.payload; },
      clearSelection: (state) => { state.selectedIds = []; },
    },
  });

export const categoryUISlice = makeUISlice('categoryUI');
export const productUISlice = makeUISlice('productUI');
export const customerUISlice = makeUISlice('customerUI');
export const orderUISlice = makeUISlice('orderUI');
export const invoiceUISlice = makeUISlice('invoiceUI');
export const userUISlice = makeUISlice('userUI');
export const roleUISlice = makeUISlice('roleUI');
export const videoUISlice = makeUISlice('videoUI');

export const store = configureStore({
  reducer: {
    categoryUI: categoryUISlice.reducer,
    productUI: productUISlice.reducer,
    customerUI: customerUISlice.reducer,
    orderUI: orderUISlice.reducer,
    invoiceUI: invoiceUISlice.reducer,
    userUI: userUISlice.reducer,
    roleUI: roleUISlice.reducer,
    videoUI: videoUISlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
