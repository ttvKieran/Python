import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Refresh token logic here
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/refresh-token', { refreshToken });
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);

        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(error.config);
      } catch (err) {
        console.log('Failed to refresh token:', err);
        // Optionally, redirect to login page here
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
