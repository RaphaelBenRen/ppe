import React, { useState } from 'react';
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
    RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { coursesAPI, qcmAPI, flashcardsAPI } from '../utils/api';

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { courses, refreshCourses, refreshQCMs, refreshFlashcards } = useData();
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showQCMModal, setShowQCMModal] = useState(false);
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [qcmOptions, setQcmOptions] = useState({ nombre_questions: 10, difficulte: 'moyen' });
    const [flashcardsOptions, setFlashcardsOptions] = useState({ nombre_flashcards: 20 });
    const [uploadData, setUploadData] = useState({
        file: null,
        titre: '',
        matiere: 'Informatique',
        annee_cible: 'Ing3',
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshCourses();
        setRefreshing(false);
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/vnd.ms-powerpoint',
                    'text/plain'
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                const fileName = file.name.replace(/\.[^/.]+$/, '');
                setUploadData({ ...uploadData, file, titre: fileName });
                setShowUploadModal(true);
            }
        } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la sélection du fichier');
            console.error(error);
        }
    };

    const submitUpload = async () => {
        if (!uploadData.file || !uploadData.titre) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setShowUploadModal(false);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', {
                uri: uploadData.file.uri,
                name: uploadData.file.name,
                type: uploadData.file.mimeType || 'application/octet-stream',
            });
            formData.append('titre', uploadData.titre);
            formData.append('description', '');
            formData.append('matiere', uploadData.matiere);
            formData.append('annee_cible', uploadData.annee_cible);
            formData.append('type_document', 'cours');

            const response = await coursesAPI.upload(formData);

            if (response.success) {
                Alert.alert('Succès', 'Cours importé avec succès');
                refreshCourses();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de l\'import');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            setUploadData({ file: null, titre: '', matiere: 'Informatique', annee_cible: 'Ing3' });
        }
    };

    const handleGenerateQCM = (course) => {
        if (!user?.has_ai_access) {
            Alert.alert(
                'Accès restreint',
                'Pour générer des QCM par IA, vous devez entrer un code d\'accès dans les paramètres.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Paramètres', onPress: () => navigation.navigate('Settings') }
                ]
            );
            return;
        }
        setSelectedCourse(course);
        setShowQCMModal(true);
    };

    const submitQCMGeneration = async () => {
        setShowQCMModal(false);
        setGenerating(true);
        try {
            const response = await qcmAPI.generateFromCourse(selectedCourse.id, qcmOptions);
            if (response.success) {
                Alert.alert('Succès', 'QCM généré avec succès');
                refreshQCMs();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la génération');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateFlashcards = (course) => {
        if (!user?.has_ai_access) {
            Alert.alert(
                'Accès restreint',
                'Pour générer des Flashcards par IA, vous devez entrer un code d\'accès dans les paramètres.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Paramètres', onPress: () => navigation.navigate('Settings') }
                ]
            );
            return;
        }
        setSelectedCourse(course);
        setShowFlashcardsModal(true);
    };

    const submitFlashcardsGeneration = async () => {
        setShowFlashcardsModal(false);
        setGenerating(true);
        try {
            const response = await flashcardsAPI.generateFromCourse(selectedCourse.id, flashcardsOptions);
            if (response.success) {
                Alert.alert('Succès', 'Flashcards générées avec succès');
                refreshFlashcards();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la génération');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        Alert.alert(
            'Supprimer ce cours',
            'Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await coursesAPI.deleteCourse(courseId);
                            refreshCourses();
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

    const matieres = ['Informatique', 'Mathématiques', 'Physique', 'Électronique', 'Anglais', 'Autre'];
    const annees = ['Ing1', 'Ing2', 'Ing3'];

    const renderCourse = ({ item }) => (
        <View style={styles.courseCard}>
            <TouchableOpacity
                style={styles.courseMain}
                onPress={() => handleOpenCourse(item)}
                activeOpacity={0.7}
            >
                <View style={styles.courseIcon}>
                    <Text style={styles.courseIconText}>
                        {item.file_type === 'pdf' ? '📄' : item.file_type === 'txt' ? '📝' : '📑'}
                    </Text>
                </View>
                <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={1}>{item.titre}</Text>
                    <Text style={styles.courseMeta}>
                        {item.matiere} • {item.annee_cible}
                    </Text>
                </View>
                <Text style={styles.courseArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.courseActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleGenerateQCM(item)}
                >
                    <Text style={styles.actionBtnText}>QCM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleGenerateFlashcards(item)}
                >
                    <Text style={styles.actionBtnText}>Flashcards</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteCourse(item.id)}
                >
                    <Text style={styles.deleteBtnText}>Suppr.</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Bonjour, {user?.prenom}</Text>
                    <Text style={styles.subtitle}>Prêt à apprendre ?</Text>
                </View>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Loading overlay */}
            {(generating || uploading) && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#1a1a2e" />
                        <Text style={styles.loadingText}>
                            {uploading ? 'Import en cours...' : 'Génération en cours...'}
                        </Text>
                    </View>
                </View>
            )}

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={handlePickDocument}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#f0f7f0' }]}>
                            <Text style={[styles.quickActionIconText, { color: '#4a7c59' }]}>+</Text>
                        </View>
                        <Text style={styles.quickActionText}>Importer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('OCR')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#fff5e6' }]}>
                            <Text style={styles.quickActionIconEmoji}>📷</Text>
                        </View>
                        <Text style={styles.quickActionText}>Scanner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('QCM')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#f0f4f8' }]}>
                            <Text style={[styles.quickActionIconText, { color: '#4a6fa5' }]}>Q</Text>
                        </View>
                        <Text style={styles.quickActionText}>QCM</Text>
                    </TouchableOpacity>
                </View>

                {/* Courses Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mes cours</Text>
                        <Text style={styles.sectionCount}>{courses.length}</Text>
                    </View>

                    {courses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📚</Text>
                            <Text style={styles.emptyTitle}>Aucun cours</Text>
                            <Text style={styles.emptyText}>
                                Importez votre premier cours pour commencer
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={handlePickDocument}
                            >
                                <Text style={styles.emptyButtonText}>Importer un cours</Text>
                            </TouchableOpacity>
                        </View>
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

            {/* Upload Modal */}
            <Modal
                visible={showUploadModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUploadModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Importer un cours</Text>
                        <Text style={styles.modalFileName}>{uploadData.file?.name}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Titre</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.input} numberOfLines={1}>
                                    {uploadData.titre || 'Titre du cours'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Matière</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.chipContainer}>
                                    {matieres.map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.chip, uploadData.matiere === m && styles.chipActive]}
                                            onPress={() => setUploadData({ ...uploadData, matiere: m })}
                                        >
                                            <Text style={[styles.chipText, uploadData.matiere === m && styles.chipTextActive]}>
                                                {m}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Année</Text>
                            <View style={styles.chipContainer}>
                                {annees.map((a) => (
                                    <TouchableOpacity
                                        key={a}
                                        style={[styles.chip, uploadData.annee_cible === a && styles.chipActive]}
                                        onPress={() => setUploadData({ ...uploadData, annee_cible: a })}
                                    >
                                        <Text style={[styles.chipText, uploadData.annee_cible === a && styles.chipTextActive]}>
                                            {a}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnSecondary}
                                onPress={() => setShowUploadModal(false)}
                            >
                                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnPrimary}
                                onPress={submitUpload}
                            >
                                <Text style={styles.modalBtnPrimaryText}>Importer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* QCM Modal */}
            <Modal
                visible={showQCMModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowQCMModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Générer un QCM</Text>
                        <Text style={styles.modalSubtitle}>{selectedCourse?.titre}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre de questions</Text>
                            <View style={styles.chipContainer}>
                                {[5, 10, 15, 20].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[styles.chip, qcmOptions.nombre_questions === num && styles.chipActive]}
                                        onPress={() => setQcmOptions({ ...qcmOptions, nombre_questions: num })}
                                    >
                                        <Text style={[styles.chipText, qcmOptions.nombre_questions === num && styles.chipTextActive]}>
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Difficulté</Text>
                            <View style={styles.chipContainer}>
                                {['facile', 'moyen', 'difficile'].map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[styles.chip, qcmOptions.difficulte === diff && styles.chipActive]}
                                        onPress={() => setQcmOptions({ ...qcmOptions, difficulte: diff })}
                                    >
                                        <Text style={[styles.chipText, qcmOptions.difficulte === diff && styles.chipTextActive]}>
                                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnSecondary}
                                onPress={() => setShowQCMModal(false)}
                            >
                                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnPrimary}
                                onPress={submitQCMGeneration}
                            >
                                <Text style={styles.modalBtnPrimaryText}>Générer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Flashcards Modal */}
            <Modal
                visible={showFlashcardsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFlashcardsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Générer des Flashcards</Text>
                        <Text style={styles.modalSubtitle}>{selectedCourse?.titre}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre de cartes</Text>
                            <View style={styles.chipContainer}>
                                {[10, 20, 30, 50].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[styles.chip, flashcardsOptions.nombre_flashcards === num && styles.chipActive]}
                                        onPress={() => setFlashcardsOptions({ nombre_flashcards: num })}
                                    >
                                        <Text style={[styles.chipText, flashcardsOptions.nombre_flashcards === num && styles.chipTextActive]}>
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnSecondary}
                                onPress={() => setShowFlashcardsModal(false)}
                            >
                                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnPrimary}
                                onPress={submitFlashcardsGeneration}
                            >
                                <Text style={styles.modalBtnPrimaryText}>Générer</Text>
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    subtitle: {
        fontSize: 13,
        color: '#8a8a8a',
        marginTop: 2,
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    settingsIcon: {
        fontSize: 18,
    },
    content: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loadingBox: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
    },
    quickActions: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 10,
        gap: 12,
    },
    quickAction: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionIconText: {
        fontSize: 18,
        fontWeight: '600',
    },
    quickActionIconEmoji: {
        fontSize: 20,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    section: {
        padding: 20,
        paddingTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    sectionCount: {
        marginLeft: 10,
        fontSize: 14,
        color: '#8a8a8a',
        backgroundColor: '#e8e8e8',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#8a8a8a',
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyButton: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    courseCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    courseMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    courseIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseIconText: {
        fontSize: 22,
    },
    courseInfo: {
        flex: 1,
        marginLeft: 14,
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    courseMeta: {
        fontSize: 12,
        color: '#8a8a8a',
        marginTop: 3,
    },
    courseArrow: {
        fontSize: 24,
        color: '#c0c0c0',
        fontWeight: '300',
    },
    courseActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        padding: 10,
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    deleteBtn: {
        backgroundColor: '#fff5f5',
        flex: 0.6,
    },
    deleteBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#e53e3e',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8a8a8a',
        marginBottom: 24,
    },
    modalFileName: {
        fontSize: 13,
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 10,
    },
    inputContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
    },
    input: {
        fontSize: 15,
        color: '#1a1a2e',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    chipActive: {
        backgroundColor: '#1a1a2e',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
    },
    chipTextActive: {
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    modalBtnSecondary: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    modalBtnSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    modalBtnPrimary: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
    },
    modalBtnPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});

export default DashboardScreen;
