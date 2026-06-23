import axios from "axios";

// API Base URL
// In development, requests are proxied by Vite (vite.config.ts → server.proxy),
// so we use a relative base URL (""). In production, VITE_API_BASE_URL must be set.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/$/, "");

// API Clients
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;

// Product Service
export const productService = {
  getCategories: async () => {
    const response = await apiClient.get("/client/products");
    return response.data.data;
  },
  
  getFeaturedProducts: async () => {
    const response = await apiClient.get("/client/products/featured");
    return response.data.data;
  },
  
  // Example for future: getProductsByTags
  getProductsByTags: async () => {
    const response = await apiClient.get("/client/products-by-tags");
    return response.data.data;
  },

  getVideos: async () => {
    const response = await apiClient.get("/client/videos");
    return response.data.data;
  }
};

// Settings Service
export const settingsService = {
  getSettings: async () => {
    const response = await apiClient.get("/settings");
    return response.data;
  }
};

// Product Controller (legacy interface — used by useProducts hook)
export const productController = {
  getProductsByCategory: async () => {
    const response = await apiClient.get("/client/products");
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch products");
  },
  getProductsByTags: async () => {
    const response = await apiClient.get("/client/products-by-tags");
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch tagged products");
  },
};

// Shop Settings (public — no auth required)
export const getShopSettings = async () => {
  const response = await apiClient.get("/settings");
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || "Failed to fetch settings");
};

// Contact Service
export const contactService = {
  submitMessage: async (data: { name: string; phone?: string; subject?: string; message: string }) => {
    const response = await apiClient.post("/contact", data);
    return response.data;
  }
};
