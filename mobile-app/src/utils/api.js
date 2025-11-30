import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
// IMPORTANT: Remplacer par l'adresse IP de votre PC (ipconfig dans le terminal)
// Votre téléphone et PC doivent être sur le même réseau Wi-Fi
const API_URL = 'http://192.168.1.78:5001/api';

// Helper pour faire des requêtes API
const apiRequest = async (endpoint, options = {}) => {
    const token = await AsyncStorage.getItem('token');

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

// API de cours
export const coursesAPI = {
    upload: async (formData) => {
        const token = await AsyncStorage.getItem('token');

        const response = await fetch(`${API_URL}/courses/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'upload');
        }

        return data;
    },

    getMyCourses: async () => {
        return apiRequest('/courses/my-courses');
    },

    getCourse: async (id) => {
        return apiRequest(`/courses/${id}`);
    },

    getCourseContent: async (id) => {
        return apiRequest(`/courses/${id}/content`);
    },

    deleteCourse: async (id) => {
        return apiRequest(`/courses/${id}`, {
            method: 'DELETE',
        });
    },
};

// API de QCM
export const qcmAPI = {
    generateFromCourse: async (courseId, options) => {
        return apiRequest(`/qcm/generate-from-course/${courseId}`, {
            method: 'POST',
            body: JSON.stringify(options),
        });
    },

    getMyQCMs: async () => {
        return apiRequest('/qcm/my-qcms');
    },

    getQCM: async (id) => {
        return apiRequest(`/qcm/${id}`);
    },

    submitQCM: async (id, answers, tempsEcoule) => {
        return apiRequest(`/qcm/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers, tempsEcoule }),
        });
    },

    getAttempts: async (id) => {
        return apiRequest(`/qcm/${id}/attempts`);
    },

    getAttemptDetail: async (id, attemptId) => {
        return apiRequest(`/qcm/${id}/attempts/${attemptId}`);
    },

    deleteQCM: async (id) => {
        return apiRequest(`/qcm/${id}`, {
            method: 'DELETE',
        });
    },
};

// API de Flashcards
export const flashcardsAPI = {
    generateFromCourse: async (courseId, options) => {
        return apiRequest(`/flashcards/generate-from-course/${courseId}`, {
            method: 'POST',
            body: JSON.stringify(options),
        });
    },

    getMyFlashcards: async () => {
        return apiRequest('/flashcards/my-flashcards');
    },

    getFlashcardSet: async (id) => {
        return apiRequest(`/flashcards/${id}`);
    },

    deleteFlashcardSet: async (id) => {
        return apiRequest(`/flashcards/${id}`, {
            method: 'DELETE',
        });
    },
};

export default apiRequest;
