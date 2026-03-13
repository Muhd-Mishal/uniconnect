import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// Request interceptor to add the auth token header
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

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
        }
        return Promise.reject(error);
    }
);

export const aiService = {
    generateQuestions: (domain, difficulty, count) =>
        api.post('/ai/questions', { domain, difficulty, count }),

    generateResources: (topic) =>
        api.post('/ai/resources', { topic })
};

export default api;