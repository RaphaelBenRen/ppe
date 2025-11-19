import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import QCMScreen from '../screens/QCMScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import CourseViewerScreen from '../screens/CourseViewerScreen';
import QCMDetailScreen from '../screens/QCMDetailScreen';
import FlashcardDetailScreen from '../screens/FlashcardDetailScreen';
import QCMHistoryScreen from '../screens/QCMHistoryScreen';
import QCMAttemptDetailScreen from '../screens/QCMAttemptDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator pour l'écran principal
const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#667eea',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ color, size }) => (
                        <View>
                            {/* Vous pouvez ajouter des icônes ici */}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="QCM"
                component={QCMScreen}
                options={{
                    tabBarLabel: 'QCM',
                }}
            />
            <Tab.Screen
                name="Flashcards"
                component={FlashcardsScreen}
                options={{
                    tabBarLabel: 'Flashcards',
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, loading, isOnboardingComplete } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    // Auth Stack
                    <React.Fragment>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </React.Fragment>
                ) : !isOnboardingComplete ? (
                    // Onboarding Stack
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : (
                    // Main Stack
                    <React.Fragment>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="CourseViewer" component={CourseViewerScreen} />
                        <Stack.Screen name="QCMDetail" component={QCMDetailScreen} />
                        <Stack.Screen name="FlashcardDetail" component={FlashcardDetailScreen} />
                        <Stack.Screen name="QCMHistory" component={QCMHistoryScreen} />
                        <Stack.Screen name="QCMAttemptDetail" component={QCMAttemptDetailScreen} />
                    </React.Fragment>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
