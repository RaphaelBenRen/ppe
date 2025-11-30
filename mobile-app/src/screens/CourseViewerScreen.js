import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { coursesAPI } from '../utils/api';

const CourseViewerScreen = ({ route, navigation }) => {
    const { courseId, courseTitre } = route.params;
    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState(null);

    useEffect(() => {
        loadCourseContent();
    }, []);

    const loadCourseContent = async () => {
        setLoading(true);
        try {
            const response = await coursesAPI.getCourseContent(courseId);
            console.log('Response received:', response.success);
            if (response.success && response.data) {
                // S'assurer que le contenu existe
                if (!response.data.content || response.data.content.trim() === '') {
                    Alert.alert('Attention', 'Ce cours ne contient pas de texte lisible.');
                }
                setCourseData(response.data);
            } else {
                Alert.alert('Erreur', 'Impossible de charger le contenu du cours');
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors du chargement du cours');
            console.error('Erreur chargement contenu:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Chargement du cours...</Text>
            </View>
        );
    }

    if (!courseData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Impossible de charger le cours</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadCourseContent}
                >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{courseData.titre}</Text>
                    <Text style={styles.headerSubtitle}>{courseData.matiere}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.courseText} selectable={true}>
                    {courseData.content || 'Aucun contenu disponible pour ce cours.'}
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#8a8a8a',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    backButtonText: {
        color: '#1a1a2e',
        fontSize: 18,
        fontWeight: '500',
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#8a8a8a',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    courseText: {
        fontSize: 15,
        lineHeight: 28,
        color: '#333',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        textAlign: 'left',
    },
});

export default CourseViewerScreen;
