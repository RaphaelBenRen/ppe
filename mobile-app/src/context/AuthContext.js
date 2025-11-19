import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const response = await authAPI.verify();
                if (response.success) {
                    setUser(response.data.user);
                    setIsOnboardingComplete(response.data.user.onboarding_complete);
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await AsyncStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            if (response.success) {
                await AsyncStorage.setItem('token', response.data.token);
                setUser(response.data.user);
                setIsOnboardingComplete(response.data.user.onboarding_complete);
                return response;
            }
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            if (response.success) {
                await AsyncStorage.setItem('token', response.data.token);
                setUser(response.data.user);
                setIsOnboardingComplete(false);
                return response;
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
        setIsOnboardingComplete(false);
    };

    const completeOnboarding = () => {
        setIsOnboardingComplete(true);
        // Mettre à jour l'utilisateur aussi
        if (user) {
            setUser({ ...user, onboarding_complete: true });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isOnboardingComplete,
                login,
                register,
                logout,
                completeOnboarding,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
