import axios from 'axios';
import { API_BASE_URL } from './runtimeConfig';

const normalizeApiBaseUrl = (value = '') => {
    const trimmed = value.replace(/\/+$/, '');
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
    baseURL: normalizeApiBaseUrl(API_BASE_URL),
});

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
    generateQuestions: (domain, difficulty, count, format) => api.post('/ai/questions', { domain, difficulty, count, format }),
    generateResources: (topic) => api.post('/ai/resources', { topic }),
    chatbotReply: (message, history = []) => api.post('/ai/chatbot', { message, history }),
    generateDbMcq: (questionId) => api.post('/ai/db-mcq', { question_id: questionId })
};

export default api;
