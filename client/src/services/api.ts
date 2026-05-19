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
  }
};

// Settings Service
export const settingsService = {
  getSettings: async () => {
    const response = await apiClient.get("/settings");
    return response.data;
  }
};

// Contact Service
export const contactService = {
  submitMessage: async (data: { name: string; phone?: string; subject?: string; message: string }) => {
    const response = await apiClient.post("/contact", data);
    return response.data;
  }
};
