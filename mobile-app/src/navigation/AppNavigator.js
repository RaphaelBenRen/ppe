import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, useWindowDimensions, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

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
import SettingsScreen from '../screens/SettingsScreen';
import OCRScreen from '../screens/OCRScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Composant pour les icônes de tab
const TabIcon = ({ name, focused, color }) => {
    const icons = {
        home: '⌂',
        qcm: '✓',
        flash: '◇',
    };
    return (
        <Text style={{
            fontSize: 20,
            color,
            fontWeight: focused ? '700' : '400',
        }}>
            {icons[name]}
        </Text>
    );
};

// Tab Navigator pour l'écran principal
const MainTabs = () => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#1a1a2e',
                tabBarInactiveTintColor: '#b0b0b0',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#f8f9fa',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    paddingBottom: isTablet ? 20 : 25,
                    paddingTop: isTablet ? 10 : 8,
                    paddingHorizontal: isTablet ? '15%' : 0,
                    height: isTablet ? 85 : 80,
                },
                tabBarLabelStyle: {
                    fontSize: isTablet ? 13 : 11,
                    fontWeight: '500',
                    marginTop: 4,
                    marginBottom: 2,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="home" focused={focused} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="QCM"
                component={QCMScreen}
                options={{
                    tabBarLabel: 'QCM',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="qcm" focused={focused} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Flashcards"
                component={FlashcardsScreen}
                options={{
                    tabBarLabel: 'Flashcards',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="flash" focused={focused} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, loading, isOnboardingComplete } = useAuth();
    const { initialLoading, dataLoaded } = useData();

    // Écran de chargement initial (auth)
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a2e" />
            </View>
        );
    }

    // Écran de chargement des données (après connexion)
    if (user && isOnboardingComplete && initialLoading && !dataLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a2e" />
                <Text style={styles.loadingText}>Chargement de vos données...</Text>
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
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="OCR" component={OCRScreen} />
                    </React.Fragment>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
});

export default AppNavigator;
