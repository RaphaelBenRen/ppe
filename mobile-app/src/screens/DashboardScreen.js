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
    TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { coursesAPI, qcmAPI, flashcardsAPI, summariesAPI } from '../utils/api';

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
    const [showTextImportModal, setShowTextImportModal] = useState(false);
    const [textImportData, setTextImportData] = useState({
        titre: '',
        content: '',
        matiere: 'Informatique',
        annee_cible: 'Ing3',
    });
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [summaryCourseData, setSummaryCourseData] = useState(null);

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

    const submitTextImport = async () => {
        if (!textImportData.titre.trim() || !textImportData.content.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir le titre et le contenu');
            return;
        }

        if (textImportData.content.trim().length < 50) {
            Alert.alert('Erreur', 'Le contenu doit contenir au moins 50 caractères');
            return;
        }

        setShowTextImportModal(false);
        setUploading(true);

        try {
            const response = await coursesAPI.importFromText({
                titre: textImportData.titre,
                content: textImportData.content,
                matiere: textImportData.matiere,
                annee_cible: textImportData.annee_cible,
                type_document: 'cours',
            });

            if (response.success) {
                Alert.alert('Succès', 'Cours importé avec succès !');
                refreshCourses();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de l\'import');
            console.error('Text import error:', error);
        } finally {
            setUploading(false);
            setTextImportData({ titre: '', content: '', matiere: 'Informatique', annee_cible: 'Ing3' });
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

    const handleSummarizeCourse = async (course) => {
        if (!user?.has_ai_access) {
            Alert.alert(
                'Accès restreint',
                'Pour générer un résumé par IA, vous devez entrer un code d\'accès dans les paramètres.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Paramètres', onPress: () => navigation.navigate('Settings') }
                ]
            );
            return;
        }

        setGenerating(true);
        setSummaryCourseData(course);
        try {
            const response = await coursesAPI.summarizeCourse(course.id);
            if (response.success && response.data?.summary) {
                setSummaryContent(response.data.summary);
                setShowSummaryModal(true);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la génération du résumé');
        } finally {
            setGenerating(false);
        }
    };

    const saveSummary = async () => {
        if (!summaryCourseData) return;

        try {
            const response = await summariesAPI.createSummary({
                course_id: summaryCourseData.id,
                titre: `Résumé - ${summaryCourseData.titre}`,
                matiere: summaryCourseData.matiere,
                content: summaryContent,
                original_course_titre: summaryCourseData.titre,
            });
            if (response.success) {
                setShowSummaryModal(false);
                setSummaryContent('');
                setSummaryCourseData(null);
                Alert.alert(
                    'Résumé sauvegardé',
                    'Votre résumé a été enregistré. Vous pouvez le retrouver dans la section Résumés.',
                    [
                        { text: 'Fermer', style: 'cancel' },
                        {
                            text: 'Voir les résumés',
                            onPress: () => navigation.navigate('Main', { screen: 'Summaries' })
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde du résumé');
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
            {/* Bouton de suppression discret en haut à droite */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteCourse(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>

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
            </TouchableOpacity>
            <View style={styles.courseActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSummarizeCourse(item)}
                >
                    <Text style={styles.actionBtnText}>Résumé</Text>
                </TouchableOpacity>
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
                        style={styles.quickActionSmall}
                        onPress={handlePickDocument}
                    >
                        <View style={styles.quickActionIconSmall}>
                            <Text style={styles.quickActionIconTextSmall}>📄</Text>
                        </View>
                        <Text style={styles.quickActionTextSmall}>Fichier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionSmall}
                        onPress={() => setShowTextImportModal(true)}
                    >
                        <View style={styles.quickActionIconSmall}>
                            <Text style={styles.quickActionIconTextSmall}>📋</Text>
                        </View>
                        <Text style={styles.quickActionTextSmall}>Coller</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionSmall}
                        onPress={() => navigation.navigate('OCR')}
                    >
                        <View style={styles.quickActionIconSmall}>
                            <Text style={styles.quickActionIconTextSmall}>📷</Text>
                        </View>
                        <Text style={styles.quickActionTextSmall}>Scanner</Text>
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

            {/* Text Import Modal */}
            <Modal
                visible={showTextImportModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTextImportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '85%' }]}>
                        <Text style={styles.modalTitle}>Importer un cours</Text>
                        <Text style={styles.modalSubtitle}>Collez le contenu de votre cours</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Titre du cours</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Chapitre 3 - Les algorithmes"
                                    value={textImportData.titre}
                                    onChangeText={(text) => setTextImportData({ ...textImportData, titre: text })}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Contenu du cours</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    placeholder="Collez ici le contenu de votre cours..."
                                    value={textImportData.content}
                                    onChangeText={(text) => setTextImportData({ ...textImportData, content: text })}
                                    multiline
                                    numberOfLines={8}
                                    textAlignVertical="top"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Matière</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.chipContainer}>
                                        {matieres.map((m) => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.chip, textImportData.matiere === m && styles.chipActive]}
                                                onPress={() => setTextImportData({ ...textImportData, matiere: m })}
                                            >
                                                <Text style={[styles.chipText, textImportData.matiere === m && styles.chipTextActive]}>
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
                                            style={[styles.chip, textImportData.annee_cible === a && styles.chipActive]}
                                            onPress={() => setTextImportData({ ...textImportData, annee_cible: a })}
                                        >
                                            <Text style={[styles.chipText, textImportData.annee_cible === a && styles.chipTextActive]}>
                                                {a}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnSecondary}
                                onPress={() => {
                                    setShowTextImportModal(false);
                                    setTextImportData({ titre: '', content: '', matiere: 'Informatique', annee_cible: 'Ing3' });
                                }}
                            >
                                <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnPrimary}
                                onPress={submitTextImport}
                            >
                                <Text style={styles.modalBtnPrimaryText}>Importer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Summary Modal */}
            <Modal
                visible={showSummaryModal}
                animationType="slide"
                onRequestClose={() => setShowSummaryModal(false)}
            >
                <View style={styles.summaryModalContainer}>
                    <View style={styles.summaryModalHeader}>
                        <Text style={styles.summaryModalTitle}>Résumé du cours</Text>
                        <TouchableOpacity
                            style={styles.summaryCloseButton}
                            onPress={() => {
                                setShowSummaryModal(false);
                                setSummaryContent('');
                                setSummaryCourseData(null);
                            }}
                        >
                            <Text style={styles.summaryCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.summaryScrollView}
                        contentContainerStyle={styles.summaryScrollContent}
                    >
                        <Text style={styles.summaryText}>{summaryContent}</Text>
                    </ScrollView>
                    <View style={styles.summaryFooter}>
                        <TouchableOpacity style={styles.saveSummaryButton} onPress={saveSummary}>
                            <Text style={styles.saveSummaryButtonText}>Sauvegarder le résumé</Text>
                        </TouchableOpacity>
                        <Text style={styles.summaryFooterText}>
                            Le résumé sera disponible dans la section Résumés
                        </Text>
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 5,
        gap: 10,
    },
    quickActionSmall: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    quickActionIconSmall: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionIconTextSmall: {
        fontSize: 20,
    },
    quickActionTextSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a2e',
        textAlign: 'center',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 12,
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    deleteButtonText: {
        fontSize: 18,
        color: '#999',
        fontWeight: '300',
        lineHeight: 20,
    },
    courseMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingRight: 40,
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
    textInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#1a1a2e',
    },
    textArea: {
        minHeight: 150,
        maxHeight: 200,
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
    // Summary modal styles
    summaryModalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    summaryModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    summaryModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    summaryCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCloseButtonText: {
        fontSize: 18,
        color: '#666',
    },
    summaryScrollView: {
        flex: 1,
    },
    summaryScrollContent: {
        padding: 20,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#333',
    },
    summaryFooter: {
        padding: 15,
        backgroundColor: '#e8f5e9',
        borderTopWidth: 1,
        borderTopColor: '#c8e6c9',
    },
    saveSummaryButton: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    saveSummaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    summaryFooterText: {
        fontSize: 12,
        color: '#2e7d32',
        textAlign: 'center',
    },
});

export default DashboardScreen;
