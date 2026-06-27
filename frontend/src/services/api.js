import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Send cookies for refreshToken
});

// Response Interceptor for handling 401 and refreshing tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, user needs to login again
        console.error('Token refresh failed:', refreshError);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
