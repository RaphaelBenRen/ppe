import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
// Mode dev: IP locale | Mode prod: URL Render
const USE_LOCAL = true; // Passer à false pour utiliser Render
const LOCAL_IP = '192.168.1.78';
const API_URL = USE_LOCAL
    ? `http://${LOCAL_IP}:5001/api`
    : 'https://ppe-z2u3.onrender.com/api';

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
        // Gestion des erreurs réseau pour des messages user-friendly
        if (error.message === 'Network request failed') {
            throw new Error('Connexion impossible. Vérifiez votre connexion internet.');
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Impossible de contacter le serveur. Réessayez plus tard.');
        }
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

    deleteAccount: async () => {
        return apiRequest('/auth/delete-account', {
            method: 'DELETE',
        });
    },

    redeemCode: async (code) => {
        return apiRequest('/auth/redeem-code', {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
    },

    getAiAccessStatus: async () => {
        return apiRequest('/auth/ai-access-status');
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

    updateProfile: async (profileData) => {
        return apiRequest('/onboarding/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    },

    getMatieres: async () => {
        return apiRequest('/onboarding/matieres');
    },

    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
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

    askQuestion: async (courseId, data) => {
        return apiRequest(`/courses/${courseId}/ask`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getHighlights: async (courseId) => {
        return apiRequest(`/courses/${courseId}/highlights`);
    },

    saveHighlights: async (courseId, highlights) => {
        return apiRequest(`/courses/${courseId}/highlights`, {
            method: 'POST',
            body: JSON.stringify({ highlights }),
        });
    },

    getFileUrl: async (courseId) => {
        const token = await AsyncStorage.getItem('token');
        return {
            url: `${API_URL}/courses/${courseId}/file`,
            token: token
        };
    },

    // OCR - Extraction de texte depuis une image
    extractTextFromImage: async (imageUri) => {
        const token = await AsyncStorage.getItem('token');

        const formData = new FormData();
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
        });

        const response = await fetch(`${API_URL}/courses/ocr`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'extraction du texte');
        }

        return data;
    },

    // Créer un cours depuis le texte OCR
    uploadFromOCR: async (courseData) => {
        return apiRequest('/courses/upload-from-ocr', {
            method: 'POST',
            body: JSON.stringify(courseData),
        });
    },

    // Mettre à jour le contenu textuel d'un cours
    updateContent: async (courseId, content) => {
        return apiRequest(`/courses/${courseId}/content`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    // Reformater le contenu d'un cours avec l'IA
    reformatContent: async (courseId) => {
        return apiRequest(`/courses/${courseId}/reformat`, {
            method: 'POST',
        });
    },

    // Importer un cours depuis du texte (copier-coller)
    importFromText: async (courseData) => {
        return apiRequest('/courses/import-from-text', {
            method: 'POST',
            body: JSON.stringify(courseData),
        });
    },

    // Résumer un cours (garder les notions essentielles)
    summarizeCourse: async (courseId) => {
        return apiRequest(`/courses/${courseId}/summarize`, {
            method: 'POST',
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

    // Importer un QCM depuis du texte (copier-coller)
    importFromText: async (textContent, options = {}) => {
        return apiRequest('/qcm/import-from-text', {
            method: 'POST',
            body: JSON.stringify({
                textContent,
                titre: options.titre,
                matiere: options.matiere,
                difficulte: options.difficulte,
            }),
        });
    },

    // Importer un QCM depuis un fichier PDF
    importFromFile: async (file, options = {}) => {
        const token = await AsyncStorage.getItem('token');

        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/pdf',
        });
        if (options.titre) formData.append('titre', options.titre);
        if (options.matiere) formData.append('matiere', options.matiere);
        if (options.difficulte) formData.append('difficulte', options.difficulte);

        const response = await fetch(`${API_URL}/qcm/import-from-file`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de l\'import du QCM');
        }

        return data;
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

// API de Résumés
export const summariesAPI = {
    getMySummaries: async () => {
        return apiRequest('/summaries/my-summaries');
    },

    getSummary: async (id) => {
        return apiRequest(`/summaries/${id}`);
    },

    createSummary: async (data) => {
        return apiRequest('/summaries/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateContent: async (id, content) => {
        return apiRequest(`/summaries/${id}/content`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    reformatSummary: async (id) => {
        return apiRequest(`/summaries/${id}/reformat`, {
            method: 'POST',
        });
    },

    askQuestion: async (id, data) => {
        return apiRequest(`/summaries/${id}/ask`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deleteSummary: async (id) => {
        return apiRequest(`/summaries/${id}`, {
            method: 'DELETE',
        });
    },
};

export default apiRequest;
