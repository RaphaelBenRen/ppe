import React, { createContext, useState, useContext, useEffect } from 'react';
import { coursesAPI, qcmAPI, flashcardsAPI } from '../utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const { user, isOnboardingComplete } = useAuth();

    // États des données
    const [courses, setCourses] = useState([]);
    const [qcms, setQcms] = useState([]);
    const [flashcards, setFlashcards] = useState([]);

    // État de chargement initial
    const [initialLoading, setInitialLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Charger toutes les données au démarrage
    const loadAllData = async () => {
        try {
            const [coursesRes, qcmsRes, flashcardsRes] = await Promise.all([
                coursesAPI.getMyCourses(),
                qcmAPI.getMyQCMs(),
                flashcardsAPI.getMyFlashcards()
            ]);

            if (coursesRes.success) {
                setCourses(coursesRes.data || []);
            }
            if (qcmsRes.success) {
                setQcms(qcmsRes.data || []);
            }
            if (flashcardsRes.success) {
                setFlashcards(flashcardsRes.data || []);
            }

            setDataLoaded(true);
        } catch (error) {
            console.error('Erreur chargement données:', error);
            setDataLoaded(true); // On marque comme chargé même en cas d'erreur pour ne pas bloquer
        } finally {
            setInitialLoading(false);
        }
    };

    // Rafraîchir silencieusement (sans loading visible)
    const refreshCourses = async () => {
        try {
            const response = await coursesAPI.getMyCourses();
            if (response.success) {
                setCourses(response.data || []);
            }
        } catch (error) {
            console.error('Erreur refresh cours:', error);
        }
    };

    const refreshQCMs = async () => {
        try {
            const response = await qcmAPI.getMyQCMs();
            if (response.success) {
                setQcms(response.data || []);
            }
        } catch (error) {
            console.error('Erreur refresh QCMs:', error);
        }
    };

    const refreshFlashcards = async () => {
        try {
            const response = await flashcardsAPI.getMyFlashcards();
            if (response.success) {
                setFlashcards(response.data || []);
            }
        } catch (error) {
            console.error('Erreur refresh flashcards:', error);
        }
    };

    const refreshAll = async () => {
        await Promise.all([
            refreshCourses(),
            refreshQCMs(),
            refreshFlashcards()
        ]);
    };

    // Charger les données quand l'utilisateur est connecté et a terminé l'onboarding
    useEffect(() => {
        if (user && isOnboardingComplete && !dataLoaded) {
            loadAllData();
        } else if (!user) {
            // Réinitialiser quand l'utilisateur se déconnecte
            setCourses([]);
            setQcms([]);
            setFlashcards([]);
            setDataLoaded(false);
            setInitialLoading(true);
        } else if (user && !isOnboardingComplete) {
            // Si l'utilisateur n'a pas terminé l'onboarding, pas besoin de charger
            setInitialLoading(false);
            setDataLoaded(true);
        }
    }, [user, isOnboardingComplete]);

    const value = {
        // Données
        courses,
        qcms,
        flashcards,

        // État
        initialLoading,
        dataLoaded,

        // Actions
        refreshCourses,
        refreshQCMs,
        refreshFlashcards,
        refreshAll,

        // Setters directs pour mises à jour optimistes
        setCourses,
        setQcms,
        setFlashcards,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
