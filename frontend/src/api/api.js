import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({

    baseURL: API_BASE_URL,

    headers: {
        'Content-Type': 'application/json',
    },

    withCredentials: false,

});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, (error) => {

    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (!isLoginRequest) {

        const status = error.response?.status;
        const isAuthError = status === 401 || status === 403;
        const isNetworkError = !error.response && error.message === "Network Error";

        if (isAuthError || isNetworkError) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth:logout'));
        }

    }

    return Promise.reject(error);

});

export default api;