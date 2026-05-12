import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/redux/Store";
import { setCategories, setLoading, setError } from "@/redux/Slice/ProductSlice";
import { productController } from "@/services/productController";
import { useEffect } from "react";

/**
 * Hook to handle Product fetching via TanStack Query and sync with Redux.
 * This provides fast, cached rendering while keeping global state updated.
 */
export const useProducts = () => {
  const dispatch = useAppDispatch();
  const reduxCategories = useAppSelector((state) => state.products.categories);

  const query = useQuery({
    queryKey: ["products-categories"],
    queryFn: productController.getProductsByCategory,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000,    // 30 minutes garbage collection
    placeholderData: reduxCategories.length > 0 ? reduxCategories : keepPreviousData,
  });

  const { data, isLoading, isError, error } = query;

  // Sync with Redux whenever data or status changes
  useEffect(() => {
    if (isLoading && reduxCategories.length === 0) {
      dispatch(setLoading(true));
    }
    
    if (data && data !== reduxCategories) {
      dispatch(setCategories(data));
      dispatch(setLoading(false));
    }

    if (isError) {
      dispatch(setError(error?.message || "Failed to sync products"));
      dispatch(setLoading(false));
    }
  }, [data, isLoading, isError, error, dispatch, reduxCategories]);

  return {
    ...query,
    categories: data || reduxCategories || [],
  };
};
