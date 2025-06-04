// src/setupAxios.js
import axios from "axios";

// Helper to detect iOS or macOS Safari
const isAppleDevice = () => {
  return (
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) &&
    !window.MSStream
  );
};

// Monkey-patch the default axios instance
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = !isAppleDevice(); // Cookies for non-iOS/mac

// Add token in header for iOS/macOS fallback
axios.interceptors.request.use((config) => {
  if (isAppleDevice()) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
