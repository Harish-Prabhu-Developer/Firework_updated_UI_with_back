import axios from "axios";

// API Base URL
const DEFAULT_DEV_API_BASE_URL = "http://localhost:3000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : "")
).replace(/\/$/, "");

// API Client
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Product Controller for Client APIs
 */
export const productController = {
  /**
   * Fetches all categories with their products
   * @returns Promise containing formatted category and product data
   */
  getProductsByCategory: async () => {
    try {
      const response = await apiClient.get("/client/products");
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || "Failed to fetch products");
    } catch (error: any) {
      console.error("API Error [getProductsByCategory]:", error);
      throw error;
    }
  },

  /**
   * Fetches products grouped by tags
   */
  getProductsByTags: async () => {
    try {
      const response = await apiClient.get("/client/products-by-tags");
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || "Failed to fetch tagged products");
    } catch (error: any) {
      console.error("API Error [getProductsByTags]:", error);
      throw error;
    }
  }
};

/**
 * Fetches the Shop Settings (public — no auth required)
 */
export const getShopSettings = async () => {
  try {
    const response = await apiClient.get("/settings");
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch settings");
  } catch (error: any) {
    console.error("API Error [getShopSettings]:", error);
    throw error;
  }
};