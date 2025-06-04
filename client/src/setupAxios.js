import axios from "axios";

// Helper to detect iOS/macOS Safari
const isAppleDevice = () => {
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(ua) && isSafari;
  console.log("UserAgent:", ua);
  console.log("Is Apple Device:", isApple);
  return isApple;
};

console.log("Setting axios baseURL:", import.meta.env.VITE_BACKEND_URL);
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const appleDevice = isAppleDevice();
axios.defaults.withCredentials = !appleDevice;

console.log("Axios withCredentials default:", axios.defaults.withCredentials);

// Add Authorization header if Apple (fallback to sessionStorage)
axios.interceptors.request.use((config) => {
  console.log("Intercepting request to:", config.url);
  console.log("Current withCredentials:", config.withCredentials);
  if (appleDevice) {
    const token = sessionStorage.getItem("accessToken");
    console.log("Apple device detected, token from sessionStorage:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
