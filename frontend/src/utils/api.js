// Configuration de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper pour faire des requêtes API
const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Une erreur est survenue');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

// API d'authentification
export const authAPI = {
    register: async (userData) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    login: async (credentials) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    verify: async () => {
        return apiRequest('/auth/verify');
    },
};

// API d'onboarding
export const onboardingAPI = {
    complete: async (profileData) => {
        return apiRequest('/onboarding/complete', {
            method: 'POST',
            body: JSON.stringify(profileData),
        });
    },

    getProfile: async () => {
        return apiRequest('/onboarding/profile');
    },

    getMatieres: async () => {
        return apiRequest('/onboarding/matieres');
    },
};

export default apiRequest;
