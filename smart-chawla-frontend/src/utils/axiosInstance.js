import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10 minutes
  headers: {
    "Content-Type": "application/json",
  },
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Multipart/form-data হলে Content-Type auto-set করুন
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
          );

          const { token } = response.data;
          localStorage.setItem("token", token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ✅ FIXED: PUT method support for update
export const uploadWithProgress = (
  url,
  formData,
  onProgress,
  method = "post",
) => {
  return axiosInstance({
    method,
    url,
    data: formData,
    // টাইমআউট স্পেসিফিকভাবে বড় ফাইলের জন্য বাড়িয়ে দিচ্ছি
    timeout: 30 * 60 * 1000, // ৩০ মিনিট
    onUploadProgress: (progressEvent) => {
      // মোট সাইজ পাওয়া গেলে প্রগ্রেস ক্যালকুলেট করুন
      const total = progressEvent.total || formData.size;
      if (total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / total,
        );
        onProgress?.(percentCompleted);
      }
    },
  });
};
export default axiosInstance;
