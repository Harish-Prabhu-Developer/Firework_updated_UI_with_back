import axios from "axios";

// API Base URL
const DEFAULT_DEV_API_BASE_URL = "http://localhost:3000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : "")
).replace(/\/$/, "");

// API Clients
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Product Service
export const productService = {
  getCategories: async () => {
    const response = await apiClient.get("/client/products");
    return response.data.data;
  },
  
  // Example for future: getProductsByTags
  getProductsByTags: async () => {
    const response = await apiClient.get("/client/products-by-tags");
    return response.data.data;
  }
};
