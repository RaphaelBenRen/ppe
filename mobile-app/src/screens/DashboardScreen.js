import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    FlatList,
    Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, qcmAPI, flashcardsAPI } from '../utils/api';

const DashboardScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showQCMModal, setShowQCMModal] = useState(false);
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [qcmOptions, setQcmOptions] = useState({ nombre_questions: 10, difficulte: 'moyen' });
    const [flashcardsOptions, setFlashcardsOptions] = useState({ nombre_flashcards: 20 });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const response = await coursesAPI.getMyCourses();
            if (response.success && response.data) {
                setCourses(response.data);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error('Erreur chargement cours:', error);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                await uploadCourse(file);
            }
        } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la sélection du fichier');
            console.error(error);
        }
    };

    const uploadCourse = async (file) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            });

            // Valeurs par défaut
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            formData.append('titre', fileName);
            formData.append('description', '');
            formData.append('matiere', 'Informatique');
            formData.append('annee_cible', 'Ing3');
            formData.append('type_document', 'cours');

            const response = await coursesAPI.upload(formData);

            if (response.success) {
                Alert.alert('Succès', 'Cours uploadé avec succès !');
                loadCourses();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de l\'upload');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleGenerateQCM = (course) => {
        setSelectedCourse(course);
        setShowQCMModal(true);
    };

    const submitQCMGeneration = async () => {
        setShowQCMModal(false);
        setLoading(true);
        try {
            console.log('🎯 Génération QCM pour cours:', selectedCourse.id);
            console.log('📋 Options:', qcmOptions);
            const response = await qcmAPI.generateFromCourse(selectedCourse.id, qcmOptions);
            console.log('✅ Réponse QCM:', response);
            if (response.success) {
                Alert.alert('Succès', 'QCM généré avec succès !', [
                    { text: 'OK', onPress: () => {} }
                ]);
            }
        } catch (error) {
            console.error('❌ Erreur génération QCM:', error);
            Alert.alert('Erreur', error.message || 'Erreur lors de la génération du QCM');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateFlashcards = (course) => {
        setSelectedCourse(course);
        setShowFlashcardsModal(true);
    };

    const submitFlashcardsGeneration = async () => {
        setShowFlashcardsModal(false);
        setLoading(true);
        try {
            console.log('🎯 Génération Flashcards pour cours:', selectedCourse.id);
            console.log('📋 Options:', flashcardsOptions);
            const response = await flashcardsAPI.generateFromCourse(selectedCourse.id, flashcardsOptions);
            console.log('✅ Réponse Flashcards:', response);
            if (response.success) {
                Alert.alert('Succès', 'Flashcards générées avec succès !', [
                    { text: 'OK', onPress: () => {} }
                ]);
            }
        } catch (error) {
            console.error('❌ Erreur génération Flashcards:', error);
            Alert.alert('Erreur', error.message || 'Erreur lors de la génération des flashcards');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        Alert.alert(
            'Confirmer',
            'Êtes-vous sûr de vouloir supprimer ce cours ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await coursesAPI.deleteCourse(courseId);
                            Alert.alert('Succès', 'Cours supprimé');
                            loadCourses();
                        } catch (error) {
                            Alert.alert('Erreur', 'Erreur lors de la suppression');
                        }
                    },
                },
            ]
        );
    };

    const handleOpenCourse = (course) => {
        navigation.navigate('CourseViewer', {
            courseId: course.id,
            courseTitre: course.titre,
        });
    };

    const renderCourse = ({ item }) => (
        <View style={styles.courseCard}>
            <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{item.titre}</Text>
                <Text style={styles.courseMatiere}>{item.matiere}</Text>
            </View>
            <Text style={styles.courseInfo}>
                {item.annee_cible} • {item.type_document}
            </Text>
            {item.description && (
                <Text style={styles.courseDescription}>{item.description}</Text>
            )}
            <View style={styles.courseActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.readButton]}
                    onPress={() => handleOpenCourse(item)}
                >
                    <Text style={styles.actionButtonText}>📖 Lire</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.qcmButton]}
                    onPress={() => handleGenerateQCM(item)}
                >
                    <Text style={styles.actionButtonText}>📝 QCM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.flashButton]}
                    onPress={() => handleGenerateFlashcards(item)}
                >
                    <Text style={styles.actionButtonText}>🗂️ Flash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteCourse(item.id)}
                >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bonjour {user?.prenom} 👋</Text>
                    <Text style={styles.subtitle}>Bienvenue sur ECE Learning</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.uploadSection}>
                    <Text style={styles.sectionTitle}>📤 Uploader un cours</Text>
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handlePickDocument}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#667eea" />
                        ) : (
                            <>
                                <Text style={styles.uploadIcon}>📁</Text>
                                <Text style={styles.uploadText}>Choisir un fichier</Text>
                                <Text style={styles.uploadSubtext}>PDF, DOCX ou TXT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.coursesSection}>
                    <Text style={styles.sectionTitle}>📚 Mes cours ({courses?.length || 0})</Text>
                    {loading && (!courses || courses.length === 0) ? (
                        <ActivityIndicator color="#667eea" style={{ marginTop: 20 }} />
                    ) : (!courses || courses.length === 0) ? (
                        <Text style={styles.emptyText}>Aucun cours uploadé pour le moment</Text>
                    ) : (
                        <FlatList
                            data={courses}
                            renderItem={renderCourse}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Modal QCM */}
            <Modal
                visible={showQCMModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowQCMModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Générer un QCM</Text>
                        <Text style={styles.modalCourse}>{selectedCourse?.titre}</Text>

                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>Nombre de questions</Text>
                            <View style={styles.optionButtons}>
                                {[5, 10, 15, 20].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.optionButton,
                                            qcmOptions.nombre_questions === num && styles.optionButtonActive,
                                        ]}
                                        onPress={() => setQcmOptions({ ...qcmOptions, nombre_questions: num })}
                                    >
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                qcmOptions.nombre_questions === num && styles.optionButtonTextActive,
                                            ]}
                                        >
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>Difficulté</Text>
                            <View style={styles.optionButtons}>
                                {['facile', 'moyen', 'difficile'].map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[
                                            styles.optionButton,
                                            qcmOptions.difficulte === diff && styles.optionButtonActive,
                                        ]}
                                        onPress={() => setQcmOptions({ ...qcmOptions, difficulte: diff })}
                                    >
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                qcmOptions.difficulte === diff && styles.optionButtonTextActive,
                                            ]}
                                        >
                                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowQCMModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.generateButton]}
                                onPress={submitQCMGeneration}
                            >
                                <Text style={styles.generateButtonText}>Générer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Flashcards */}
            <Modal
                visible={showFlashcardsModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFlashcardsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Générer des Flashcards</Text>
                        <Text style={styles.modalCourse}>{selectedCourse?.titre}</Text>

                        <View style={styles.optionGroup}>
                            <Text style={styles.optionLabel}>Nombre de flashcards</Text>
                            <View style={styles.optionButtons}>
                                {[10, 20, 30, 50].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.optionButton,
                                            flashcardsOptions.nombre_flashcards === num && styles.optionButtonActive,
                                        ]}
                                        onPress={() => setFlashcardsOptions({ nombre_flashcards: num })}
                                    >
                                        <Text
                                            style={[
                                                styles.optionButtonText,
                                                flashcardsOptions.nombre_flashcards === num && styles.optionButtonTextActive,
                                            ]}
                                        >
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowFlashcardsModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.generateButton]}
                                onPress={submitFlashcardsGeneration}
                            >
                                <Text style={styles.generateButtonText}>Générer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        backgroundColor: '#667eea',
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        marginTop: 5,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    uploadSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    uploadButton: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#667eea',
        borderStyle: 'dashed',
    },
    uploadIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
        marginBottom: 5,
    },
    uploadSubtext: {
        fontSize: 12,
        color: '#666',
    },
    coursesSection: {
        marginBottom: 30,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginTop: 20,
    },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    courseMatiere: {
        fontSize: 12,
        color: '#667eea',
        backgroundColor: '#e8ebf9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontWeight: '600',
    },
    courseInfo: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    courseDescription: {
        fontSize: 13,
        color: '#555',
        marginBottom: 10,
    },
    courseActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    readButton: {
        backgroundColor: '#4caf50',
    },
    qcmButton: {
        backgroundColor: '#667eea',
    },
    flashButton: {
        backgroundColor: '#764ba2',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
        flex: 0.3,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalCourse: {
        fontSize: 14,
        color: '#667eea',
        marginBottom: 25,
    },
    optionGroup: {
        marginBottom: 25,
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    optionButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    optionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    optionButtonActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    optionButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    optionButtonTextActive: {
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
    },
    generateButton: {
        backgroundColor: '#667eea',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default DashboardScreen;
