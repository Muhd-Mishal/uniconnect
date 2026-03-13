import axios from 'axios';
import { API_BASE_URL } from '../utils/runtimeConfig';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized (e.g., redirect to login or clear token)
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            // window.location.href = '/login'; // Alternatively let components handle it
        }
        return Promise.reject(error);
    }
);

export const aiService = {
    generateQuestions: (domain, difficulty, count) => api.post('/ai/questions', { domain, difficulty, count }),
    generateResources: (topic) => api.post('/ai/resources', { topic })
};

export default api;
