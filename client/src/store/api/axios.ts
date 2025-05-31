import axios from 'axios';

// Define the base URL for your backend API
const API_BASE_URL = import.meta.env.URL;

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies
});

// Create a function to set the auth token that can be called from components
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;